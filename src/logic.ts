import type * as Party from "partykit/server";
import { machine, timeout } from "./machine";
import type { ClientMessage, Player } from "./types";
import { gameState } from "./gameState";

// Timing constants
const REVEAL_WORD_SPEED = 100; // 100ms
const INITIAL_QUESTION_DELAY = 1000; // 1 second delay before first word
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds after question reveal
const OPTION_SELECTION_TIMEOUT = 5000; // 5 seconds after options reveal
const REVEAL_ANSWER_TIME = 3000; // 3 seconds after answer reveal
const GIVE_POINTS_TIME = 500; // 0.5 seconds after points given
const POINTS_PER_CORRECT_ANSWER = 10; // Points awarded for correct answer

const onConnect = (conn: Party.Connection, ctx: Party.ConnectionContext) => {
    // Send current game state to the new connection
    conn.send(
        JSON.stringify({
            type: "update",
            data: {
                ...gameState,
            },
        })
    );
}

const onClose = (connection: Party.Connection) => {
    // Get the player ID for this connection
    const playerId = gameState.connections[connection.id];

    if (playerId) {
        // Remove the mapping
        delete gameState.connections[connection.id];

        // Check if there are any other connections for this player
        const hasOtherConnections = Object.values(gameState.connections).includes(playerId);

        if (!hasOtherConnections) {
            // No other connections for this player, remove from game state
            delete gameState.players[playerId];
        }
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

const onMessage = (message: string, sender: any) => {
    try {
        const clientMessage: ClientMessage = JSON.parse(message);
        const playerId = gameState.connections[sender.id] || sender.id;
        
        switch (clientMessage.type) {
            case "startGame":
                app.startGame();
                break;
            case "selectOption":
                app.selectOption(clientMessage.data.option, playerId);
                break;
            case "resetGame":
                app.resetGame();
                break;
            case "joinAsPlayer":
                if (clientMessage.data.name) {
                    gameState.connections[sender.id] = clientMessage.data.connectionId || sender.id;
                    createOrUpdatePlayer(
                        clientMessage.data.connectionId || sender.id,
                        clientMessage.data.name,
                        clientMessage.data.avatar
                    );
                }
                break;
            case "changeProfile":
                if (clientMessage.data.name || clientMessage.data.avatar) {
                    gameState.connections[sender.id] = playerId;
                    createOrUpdatePlayer(playerId, clientMessage.data.name, clientMessage.data.avatar);
                }
                break;
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
}

const resetGame = () => {
    gameState.rounds = [];
    gameState.currentRound = 0;
    Object.values(gameState.players).forEach(player => player.points = 0);
    app.toLobby();
};

const startGame = () => {
    gameState.rounds = gameState.questions.map(q => ({
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
    const question = gameState.questions.find(q => q.id === round.questionId);
    
    if (!question) return;
    
    const words = question.text.split(" ");
    words.forEach((_, index) => {
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
    const question = gameState.questions.find(q => q.id === round.questionId);
    
    if (question) {
        const correctAnswer = question.answer;
        Object.values(gameState.players).forEach(player => {
            if (round.chosenOptions[player.id] === correctAnswer) {
                player.points += POINTS_PER_CORRECT_ANSWER;
            }
        });
    }
    timeout(GIVE_POINTS_TIME, app.toFinishingRound);
};

const common = { onConnect, onClose, onMessage, resetGame }

export const app = machine({
    lobby: { startGame, ...common },
    preQuestioning: { init: preQuestioningInit, ...common },
    questioning: { init: questioningInit, ...common },
    afterQuestioning: { init: afterQuestioningInit, ...common },
    showingOptions: { init: showingOptionsInit, selectOption, ...common },
    revealingAnswer: { init: revealingAnswerInit, ...common },
    givingPoints: { init: givingPointsInit, ...common },
    finishingRound: { ...common },
}, "lobby", () => { gameState.phase = app.state })