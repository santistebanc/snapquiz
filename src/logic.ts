import { router, store, timeout, type Config, type Router } from "./machine";
import type { GameState, Player, Question } from "./types";

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
const REVEAL_ANSWER_TIME = 3000; // 3 seconds after answer reveal
const GIVE_POINTS_TIME = 500; // 0.5 seconds after points given
const POINTS_PER_CORRECT_ANSWER = 10; // Points awarded for correct answer
const TRANSITIONING_NEXT_ROUND_TIME = 1000; // 1 second transition time

function resetGame(this: ServerState) {
    this.gameState.rounds = [];
    this.gameState.currentRound = 0;
    (Object.values(this.gameState.players) as Player[]).forEach((player: Player) => player.points = 0);
    this.router.toLobby();
}

function startGame(this: ServerState) {
    this.gameState.rounds = this.gameState.questions.map((q: Question) => ({
        questionId: q.id,
        chosenOptions: {},
        revealedWordsIndex: 0,
        shuffledOptions: shuffleArray(q.options),
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
        timeout(index * REVEAL_WORD_SPEED, () => {
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
    if (round) round.chosenOptions[playerId] = option;
}

function revealingAnswerInit(this: ServerState) {
    timeout(REVEAL_ANSWER_TIME, () => this.router.toGivingPoints());
}

function givingPointsInit(this: ServerState) {
    const round = this.gameState.rounds[this.gameState.currentRound - 1];
    const question = this.gameState.questions.find((q: Question) => q.id === round.questionId);

    if (question) {
        const correctAnswer = question.answer;
        (Object.values(this.gameState.players) as Player[]).forEach((player: Player) => {
            if (round.chosenOptions[player.id] === correctAnswer) {
                player.points += POINTS_PER_CORRECT_ANSWER;
            }
        });
    }
    timeout(GIVE_POINTS_TIME, this.router.toFinishingRound);
}

function transitioningNextRoundInit(this: ServerState) {
    timeout(TRANSITIONING_NEXT_ROUND_TIME, () => {
        if (this.gameState.currentRound < this.gameState.rounds.length) {
            this.gameState.currentRound++;
            this.router.toPreQuestioning();
        } else {
            // All rounds completed, go back to lobby
            this.router.toLobby();
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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const newQuestions = await generateQuestionsUtil(categories, this.gameState.questions, apiKey);
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
    };

    this.gameState.players[playerId] = player;
    return player;
}

const common = { resetGame, nextRound, updateQuestions, reorderQuestions, removeQuestion, generateQuestions, joinAsPlayer, changeProfile, createOrUpdatePlayer }

export const routes = {
    lobby: { startGame, ...common },
    preQuestioning: { init: preQuestioningInit, ...common },
    questioning: { init: questioningInit, ...common },
    afterQuestioning: { init: afterQuestioningInit, ...common },
    showingOptions: { init: showingOptionsInit, selectOption, ...common },
    revealingAnswer: { init: revealingAnswerInit, ...common },
    givingPoints: { init: givingPointsInit, ...common },
    finishingRound: { ...common },
    transitioningNextRound: { init: transitioningNextRoundInit, ...common },
} as const satisfies Config;