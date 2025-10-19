import { router, timeout } from "./machine";
import type { Player } from "./types";
import { serverState } from "./serverState";

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
const REVEAL_WORD_SPEED = 100; // 100ms
const INITIAL_QUESTION_DELAY = 2000; // 2 seconds delay before first word
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds after question reveal
const OPTION_SELECTION_TIMEOUT = 5000; // 5 seconds after options reveal
const REVEAL_ANSWER_TIME = 3000; // 3 seconds after answer reveal
const GIVE_POINTS_TIME = 500; // 0.5 seconds after points given
const POINTS_PER_CORRECT_ANSWER = 10; // Points awarded for correct answer
const TRANSITIONING_NEXT_ROUND_TIME = 1000; // 1 second transition time

const onConnect = (send: (message: (ArrayBuffer | ArrayBufferView) | string) => void) => {
    send(JSON.stringify({
        type: "update", data: { ...serverState },
    }));
}

const onClose = (connectionId: string) => {
    const playerId = serverState.connections[connectionId];

    if (playerId) {
        delete serverState.connections[connectionId];

        const hasOtherConnections = Object.values(serverState.connections).includes(playerId);
        if (!hasOtherConnections) {
            delete serverState.players[playerId];
        }
    }
}

const onMessage = (message: string, senderId: string) => {
    const clientMessage: any = JSON.parse(message);
    const playerId = serverState.connections[senderId] || senderId;

    if (clientMessage.type === 'action') {
        (game as any)[clientMessage.data.action]?.(...clientMessage.data.args);
    }
}

// Helper function to create/update player
const createOrUpdatePlayer = (playerId: string, name?: string, avatar?: string) => {
    const existingPlayer = serverState.players[playerId];
    const truncatedName = name ? name.substring(0, 20) : existingPlayer?.name || "Player";
    const playerAvatar = avatar || existingPlayer?.avatar || "robot-1";

    const player: Player = {
        id: playerId,
        name: truncatedName,
        avatar: playerAvatar,
        connectedAt: existingPlayer?.connectedAt || Date.now(),
        points: existingPlayer?.points || 0,
    };

    serverState.players[playerId] = player;
    return player;
};

const joinAsPlayer = (senderId: string, name?: string, avatar?: string) => {
    if (name) {
        serverState.connections[senderId] = senderId;
        createOrUpdatePlayer(
            senderId,
            name,
            avatar
        );
    }
}

const changeProfile = (senderId: string, name?: string, avatar?: string) => {
    if (name || avatar) {
        serverState.connections[senderId] = senderId;
        createOrUpdatePlayer(senderId, name, avatar);
    }
}

const resetGame = () => {
    serverState.rounds = [];
    serverState.currentRound = 0;
    (Object.values(serverState.players) as Player[]).forEach((player: Player) => player.points = 0);
    game.toLobby();
};

const startGame = () => {
    serverState.rounds = serverState.questions.map((q: any) => ({
        questionId: q.id,
        chosenOptions: {},
        revealedWordsIndex: 0,
        shuffledOptions: shuffleArray(q.options),
    }));
    serverState.currentRound = 1;
    game.toPreQuestioning();
};

const preQuestioningInit = () => {
    timeout(INITIAL_QUESTION_DELAY, () => {
        game.toQuestioning()
    })
}

const questioningInit = () => {
    const round = serverState.rounds[serverState.currentRound - 1];
    const question = serverState.questions.find((q: any) => q.id === round.questionId);

    if (!question) return;

    const words = question.text.split(" ");
    words.forEach((_: any, index: number) => {
        timeout(index * REVEAL_WORD_SPEED, () => {
            round.revealedWordsIndex = Math.max(round.revealedWordsIndex, index + 1);
            if (round.revealedWordsIndex === words.length) {
                game.toAfterQuestioning();
            }
        });
    });
};

const afterQuestioningInit = () => {
    timeout(WAIT_AFTER_QUESTION_TIME, () => {
        game.toShowingOptions();
    })
}

const showingOptionsInit = () => {
    timeout(OPTION_SELECTION_TIMEOUT, () => game.toRevealingAnswer());
};

const selectOption = (option: string, playerId: string) => {
    const round = serverState.rounds[serverState.currentRound - 1];
    if (round) round.chosenOptions[playerId] = option;
};

const revealingAnswerInit = () => {
    timeout(REVEAL_ANSWER_TIME, () => game.toGivingPoints());
};

const givingPointsInit = () => {
    const round = serverState.rounds[serverState.currentRound - 1];
    const question = serverState.questions.find((q: any) => q.id === round.questionId);

    if (question) {
        const correctAnswer = question.answer;
        (Object.values(serverState.players) as Player[]).forEach((player: Player) => {
            if (round.chosenOptions[player.id] === correctAnswer) {
                player.points += POINTS_PER_CORRECT_ANSWER;
            }
        });
    }
    timeout(GIVE_POINTS_TIME, game.toFinishingRound);
};

const transitioningNextRoundInit = () => {
    timeout(TRANSITIONING_NEXT_ROUND_TIME, () => {
        if (serverState.currentRound < serverState.rounds.length) {
            serverState.currentRound++;
            game.toPreQuestioning();
        } else {
            // All rounds completed, go back to lobby
            game.toLobby();
        }
    });
};

const nextRound = () => {
    game.toTransitioningNextRound()
};

const common = { onConnect, onClose, onMessage, joinAsPlayer, changeProfile, resetGame, nextRound }

export const game = router({
    lobby: { startGame, ...common },
    preQuestioning: { init: preQuestioningInit, ...common },
    questioning: { init: questioningInit, ...common },
    afterQuestioning: { init: afterQuestioningInit, ...common },
    showingOptions: { init: showingOptionsInit, selectOption, ...common },
    revealingAnswer: { init: revealingAnswerInit, ...common },
    givingPoints: { init: givingPointsInit, ...common },
    finishingRound: { ...common },
    transitioningNextRound: { init: transitioningNextRoundInit, ...common },
}, "lobby", () => { serverState.phase = game.state })