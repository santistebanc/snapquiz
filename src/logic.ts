import { router, store, timeout, type Config, type Router } from "./machine";
import type { GameState, Player, Question } from "./types";
import { BUZZER_ANSWER_TIMEOUT } from "./constants";
import { evaluateAnswer } from "./utils/evaluateAnswer";

export interface ServerState {
    gameState: GameState;
    router: Router<typeof routes>;
    connections: Record<string, string>;
}

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Timing constants
const REVEAL_WORD_SPEED = 200; // 100ms
const INITIAL_QUESTION_DELAY = 2000; // 2 seconds delay before first word
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds after question reveal
const OPTION_SELECTION_TIMEOUT = 5000; // 5 seconds after options reveal
const REVEAL_ANSWER_TIME = 8000; // 8 seconds after answer reveal
const GIVE_POINTS_TIME = 3000; // 3 seconds after points given
const POINTS_PER_CORRECT_ANSWER = 10; // Points awarded for correct answer
const TRANSITIONING_NEXT_ROUND_TIME = 1000; // 1 second transition time
const SHOW_EVALUATION_RESULT_TIME = 2000; // 2 seconds to show correct/wrong result

function resetGame(this: ServerState) {
    this.gameState.rounds = [];
    this.gameState.currentRound = 0;
    (Object.values(this.gameState.players) as Player[]).forEach((player: Player) => player.points = 0);
    this.router.toLobby();
}

function startGame(this: ServerState) {
    this.gameState.rounds = this.gameState.questions.map((q: Question) => ({
        questionId: q.id,
        playerAnswers: {},
        revealedWordsIndex: 0,
        shuffledOptions: shuffleArray(q.options),
        buzzedPlayerId: null,
        evaluationResult: null,
        pointsAwarded: {},
    }));
    this.gameState.currentRound = 1;
    this.router.toPreQuestioning();
}

function preQuestioningInit(this: ServerState) {
    timeout(INITIAL_QUESTION_DELAY, () => {
        this.router.toQuestioning()
    })
}

function questioningInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    const question = this.gameState.questions.find((q: Question) => q.id === round.questionId);

    if (!question) return;

    const words = question.text.split(" ");

    words.forEach((_: string, index: number) => {
        const timeStamp = question.wordTimestamps?.[index]?.start;
        timeout(timeStamp ? timeStamp * 1000 : index * REVEAL_WORD_SPEED, () => {
            round.revealedWordsIndex = Math.max(round.revealedWordsIndex, index + 1);
            if (round.revealedWordsIndex === words.length) {
                this.router.toAfterQuestioning();
            }
        });
    });
}

function afterQuestioningInit(this: ServerState) {
    timeout(WAIT_AFTER_QUESTION_TIME, () => {
        this.router.toShowingOptions();
    })
}

function showingOptionsInit(this: ServerState) {
    timeout(OPTION_SELECTION_TIMEOUT, () => this.router.toRevealingAnswer());
}

function selectOption(this: ServerState, option: string, playerId: string) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    round.playerAnswers[playerId] = option;
}

function revealingAnswerInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    const question = this.gameState.questions.find((q: Question) => q.id === round.questionId);

    // Record points for correct answers (will be applied in givingPoints)
    if (question) {
        const correctAnswer = question.answer;
        (Object.values(this.gameState.players) as Player[]).forEach((player: Player) => {
            if (round.playerAnswers[player.id] === correctAnswer) {
                round.pointsAwarded[player.id] = POINTS_PER_CORRECT_ANSWER;
            }
        });
    }

    timeout(REVEAL_ANSWER_TIME, () => this.router.toGivingPoints());
}

function givingPointsInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];

    // Apply points that were recorded in pointsAwarded
    if (round) {
        Object.entries(round.pointsAwarded).forEach(([playerId, points]) => {
            const player = this.gameState.players[playerId];
            if (player) {
                player.points = Math.max(0, player.points + points); // Ensure points never go below 0
            }
        });
    }
}

function transitioningNextRoundInit(this: ServerState) {
    timeout(TRANSITIONING_NEXT_ROUND_TIME, () => {
        if (this.gameState.currentRound < this.gameState.rounds.length) {
            this.gameState.currentRound++;
            this.router.toPreQuestioning();
        } else {
            // All rounds completed, show game over screen
            this.router.toGameOver();
        }
    });
}

function nextRound(this: ServerState) {
    this.router.toTransitioningNextRound()
}

function updateQuestions(this: ServerState, questions: Question[]) {
    this.gameState.questions = questions;
}

function reorderQuestions(this: ServerState, oldIndex: number, newIndex: number) {
    const questions = [...this.gameState.questions];
    const [movedQuestion] = questions.splice(oldIndex, 1);
    questions.splice(newIndex, 0, movedQuestion);
    this.gameState.questions = questions;
}

function removeQuestion(this: ServerState, questionId: string) {
    this.gameState.questions = this.gameState.questions.filter((q: Question) => q.id !== questionId);
}

async function generateQuestions(this: ServerState, categories: string[]) {
    const { generateQuestions: generateQuestionsUtil } = await import('./utils/generateQuestions');
    const newQuestions = await generateQuestionsUtil(categories, this.gameState.questions);
    this.gameState.questions = [...this.gameState.questions, ...newQuestions];
    return newQuestions;
}

function joinAsPlayer(this: ServerState, senderId: string, name?: string, avatar?: string) {
    if (name) {
        this.connections[senderId] = senderId;
        createOrUpdatePlayer.call(this,
            senderId,
            name,
            avatar
        );
    }
}

function changeProfile(this: ServerState, senderId: string, name?: string, avatar?: string) {
    if (name || avatar) {
        this.connections[senderId] = senderId;
        createOrUpdatePlayer.call(this, senderId, name, avatar);
    }
}

function createOrUpdatePlayer(this: ServerState, playerId: string, name?: string, avatar?: string) {
    const existingPlayer = this.gameState.players[playerId];
    const truncatedName = name ? name.substring(0, 20) : existingPlayer?.name || "Player";
    const playerAvatar = avatar || existingPlayer?.avatar || "robot-1";

    const player: Player = {
        id: playerId,
        name: truncatedName,
        avatar: playerAvatar,
        connectedAt: existingPlayer?.connectedAt || Date.now(),
        points: existingPlayer?.points || 0,
        isAdmin: existingPlayer?.isAdmin || false,
    };

    this.gameState.players[playerId] = player;
    return player;
}

function togglePlayerAdmin(this: ServerState, playerId: string) {
    const player = this.gameState.players[playerId];
    if (player) {
        player.isAdmin = !player.isAdmin;
    }
}

// Buzzer system functions
function buzzIn(this: ServerState, playerId: string) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    if (!round) return;

    // Check if player already has an answer
    if (round.playerAnswers[playerId]) return;

    // Check if someone else already buzzed
    if (round.buzzedPlayerId) return;

    // Set buzzer state
    round.buzzedPlayerId = playerId;
    round.evaluationResult = null;

    this.router.toBuzzing();
}

function submitAnswer(this: ServerState, answer: string, playerId: string) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    if (!round) return;

    // Verify this player buzzed
    if (round.buzzedPlayerId !== playerId) return;

    // Store the submitted answer in playerAnswers
    round.playerAnswers[playerId] = answer;

    this.router.toEvaluatingAnswer();
}

async function evaluatingAnswerInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    const question = this.gameState.questions.find((q: Question) => q.id === round.questionId);

    if (!round || !question || !round.buzzedPlayerId) return;

    const playerId = round.buzzedPlayerId;
    const playerAnswer = round.playerAnswers[playerId] || "";
    const correctAnswer = question.answer;

    // If no answer was given, immediately mark as wrong without AI evaluation
    if (!playerAnswer.trim()) {
        round.playerAnswers[playerId] = "";
        round.evaluationResult = 'wrong';
        round.pointsAwarded[playerId] = -Math.floor(POINTS_PER_CORRECT_ANSWER / 2); // Deduct half points for buzzing wrong
        this.router.toAfterBuzzEvaluation();
        return;
    }

    // Perform AI evaluation for non-empty answers
    const result = await evaluateAnswer(question, playerAnswer, correctAnswer);
    round.evaluationResult = result;

    // Record points based on evaluation (will be applied in givingPointsAfterBuzz)
    if (result === 'correct') {
        round.pointsAwarded[playerId] = POINTS_PER_CORRECT_ANSWER;
    } else {
        round.pointsAwarded[playerId] = -Math.floor(POINTS_PER_CORRECT_ANSWER / 2); // Deduct half points for buzzing wrong
    }

    this.router.toAfterBuzzEvaluation();
}

function afterBuzzEvaluationInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];

    timeout(SHOW_EVALUATION_RESULT_TIME, () => {
        if (round.evaluationResult === 'correct') {
            this.router.toGivingPointsAfterBuzz();
        } else {
            // Check if all players have answered
            const totalPlayers = Object.keys(this.gameState.players).length;
            const playersWhoAnswered = Object.keys(round.playerAnswers).length;

            if (playersWhoAnswered >= totalPlayers) {
                // All players have answered, reveal answer alone
                this.router.toRevealAnswerAlone();
            } else {
                // Some players haven't answered yet, reset buzzer state and go back to questioning
                round.buzzedPlayerId = null;
                round.evaluationResult = null;
                round.revealedWordsIndex = 0; // Reset to re-reveal words
                this.router.toQuestioning();
            }
        }
    });
}

function revealAnswerAloneInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    const question = this.gameState.questions.find((q: Question) => q.id === round?.questionId);

    // Ensure question is fully revealed
    if (round && question) {
        const words = question.text.split(" ");
        round.revealedWordsIndex = words.length;
    }

    timeout(REVEAL_ANSWER_TIME, () => {
        this.router.toGivingPointsAfterBuzz();
    });
}

function givingPointsAfterBuzzInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];

    // Apply points that were recorded in pointsAwarded
    if (round) {
        Object.entries(round.pointsAwarded).forEach(([playerId, points]) => {
            const player = this.gameState.players[playerId];
            if (player) {
                player.points = Math.max(0, player.points + points); // Ensure points never go below 0
            }
        });
    }
}

const common = { resetGame, nextRound, updateQuestions, reorderQuestions, removeQuestion, generateQuestions, joinAsPlayer, changeProfile, createOrUpdatePlayer, togglePlayerAdmin }

export const routes = {
    lobby: { startGame, ...common },
    preQuestioning: { init: preQuestioningInit, ...common },
    questioning: { init: questioningInit, buzzIn, ...common },
    afterQuestioning: { init: afterQuestioningInit, buzzIn, ...common },
    buzzing: { submitAnswer, ...common },
    evaluatingAnswer: { init: evaluatingAnswerInit, ...common },
    afterBuzzEvaluation: { init: afterBuzzEvaluationInit, ...common },
    revealAnswerAlone: { init: revealAnswerAloneInit, ...common },
    showingOptions: { init: showingOptionsInit, selectOption, ...common },
    revealingAnswer: { init: revealingAnswerInit, ...common },
    givingPoints: { init: givingPointsInit, ...common },
    givingPointsAfterBuzz: { init: givingPointsAfterBuzzInit, ...common },
    finishingRound: { ...common },
    finishingRoundAfterBuzz: { ...common },
    finishingAfterAnswerAlone: { ...common },
    transitioningNextRound: { init: transitioningNextRoundInit, ...common },
    gameOver: { ...common },
} as const satisfies Config;