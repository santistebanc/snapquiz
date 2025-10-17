import { router, timeout } from "./machine";
import type { Player } from "./types";
import { gameState } from "./gameState";

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
        type: "update", data: { ...gameState },
    }));
}

const onClose = (connectionId: string) => {
    const playerId = gameState.connections[connectionId];

    if (playerId) {
        delete gameState.connections[connectionId];

        const hasOtherConnections = Object.values(gameState.connections).includes(playerId);
        if (!hasOtherConnections) {
            delete gameState.players[playerId];
        }
    }
}

const onMessage = (message: string, senderId: string) => {
    const clientMessage: any = JSON.parse(message);
    const playerId = gameState.connections[senderId] || senderId;

    if (clientMessage.type === 'action') {
        (app as any)[clientMessage.data.action]?.(...clientMessage.data.args);
    }
}

// Helper function to create/update player
const createOrUpdatePlayer = (playerId: string, name?: string, avatar?: string) => {
    const existingPlayer = gameState.players[playerId];
    const truncatedName = name ? name.substring(0, 20) : existingPlayer?.name || "Player";
    const playerAvatar = avatar || existingPlayer?.avatar || "robot-1";

    const player: Player = {
        id: playerId,
        name: truncatedName,
        avatar: playerAvatar,
        connectedAt: existingPlayer?.connectedAt || Date.now(),
        points: existingPlayer?.points || 0,
    };

    gameState.players[playerId] = player;
    return player;
};

const joinAsPlayer = (senderId: string, name?: string, avatar?: string) => {
    if (name) {
        gameState.connections[senderId] = senderId;
        createOrUpdatePlayer(
            senderId,
            name,
            avatar
        );
    }
}

const changeProfile = (senderId: string, name?: string, avatar?: string) => {
    if (name || avatar) {
        gameState.connections[senderId] = senderId;
        createOrUpdatePlayer(senderId, name, avatar);
    }
}

const resetGame = () => {
    gameState.rounds = [];
    gameState.currentRound = 0;
    (Object.values(gameState.players) as Player[]).forEach((player: Player) => player.points = 0);
    app.toLobby();
};

const startGame = () => {
    gameState.rounds = gameState.questions.map((q: any) => ({
        questionId: q.id,
        chosenOptions: {},
        revealedWordsIndex: 0,
    }));
    gameState.currentRound = 1;
    app.toPreQuestioning();
};

const preQuestioningInit = () => {
    timeout(INITIAL_QUESTION_DELAY, () => {
        app.toQuestioning()
    })
}

const questioningInit = () => {
    const round = gameState.rounds[gameState.currentRound - 1];
    const question = gameState.questions.find((q: any) => q.id === round.questionId);

    if (!question) return;

    const words = question.text.split(" ");
    words.forEach((_: any, index: number) => {
        timeout(index * REVEAL_WORD_SPEED, () => {
            round.revealedWordsIndex = Math.max(round.revealedWordsIndex, index + 1);
            if (round.revealedWordsIndex === words.length) {
                app.toAfterQuestioning();
            }
        });
    });
};

const afterQuestioningInit = () => {
    timeout(WAIT_AFTER_QUESTION_TIME, () => {
        app.toShowingOptions();
    })
}

const showingOptionsInit = () => {
    timeout(OPTION_SELECTION_TIMEOUT, () => app.toRevealingAnswer());
};

const selectOption = (option: string, playerId: string) => {
    const round = gameState.rounds[gameState.currentRound - 1];
    if (round) round.chosenOptions[playerId] = option;
};

const revealingAnswerInit = () => {
    timeout(REVEAL_ANSWER_TIME, () => app.toGivingPoints());
};

const givingPointsInit = () => {
    const round = gameState.rounds[gameState.currentRound - 1];
    const question = gameState.questions.find((q: any) => q.id === round.questionId);

    if (question) {
        const correctAnswer = question.answer;
        (Object.values(gameState.players) as Player[]).forEach((player: Player) => {
            if (round.chosenOptions[player.id] === correctAnswer) {
                player.points += POINTS_PER_CORRECT_ANSWER;
            }
        });
    }
    timeout(GIVE_POINTS_TIME, app.toFinishingRound);
};

const transitioningNextRoundInit = () => {
    timeout(TRANSITIONING_NEXT_ROUND_TIME, () => {
        if (gameState.currentRound < gameState.rounds.length) {
            gameState.currentRound++;
            app.toPreQuestioning();
        } else {
            // All rounds completed, go back to lobby
            app.toLobby();
        }
    });
};

const nextRound = () => {
    app.toTransitioningNextRound()
};

const common = { onConnect, onClose, onMessage, joinAsPlayer, changeProfile, resetGame, nextRound }

export const app = router({
    lobby: { startGame, ...common },
    preQuestioning: { init: preQuestioningInit, ...common },
    questioning: { init: questioningInit, ...common },
    afterQuestioning: { init: afterQuestioningInit, ...common },
    showingOptions: { init: showingOptionsInit, selectOption, ...common },
    revealingAnswer: { init: revealingAnswerInit, ...common },
    givingPoints: { init: givingPointsInit, ...common },
    finishingRound: { ...common },
    transitioningNextRound: { init: transitioningNextRoundInit, ...common },
}, "lobby", () => { gameState.phase = app.state })