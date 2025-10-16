import type * as Party from "partykit/server";
import type { GameState, Player, ClientMessage } from "./types";
import { questions } from "./questions";
import { machine, timeout, type Machine, type StateFrom } from "./machine";

// Timing constants
const REVEAL_WORD_SPEED = 100; // 100ms
const INITIAL_QUESTION_DELAY = 1000; // 1 second delay before first word
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds after question reveal
const OPTION_SELECTION_TIMEOUT = 5000; // 5 seconds after options reveal
const REVEAL_ANSWER_TIME = 3000; // 3 seconds after answer reveal
const GIVE_POINTS_TIME = 500; // 0.5 seconds after points given
const POINTS_PER_CORRECT_ANSWER = 10; // Points awarded for correct answer


const boot = (gameState: GameState, broadcastGameState: () => void) => {

  const resetGame = () => {
    gameState.rounds = [];
    gameState.currentRound = 0;

    gameState.players.forEach((player) => {
      player.points = 0;
    });
    app.toLobby()
  }

  const startGame = () => {
    console.log("Starting game");
    gameState.rounds = gameState.questions.map((question) => ({
      questionId: question.id,
      chosenOptions: new Map<string, string>(),
      revealedWordsIndex: 0,
    }));
    gameState.currentRound = 1;
    app.toPreQuestioning()
  }

  const preQuestioningInit = () => {
    timeout(INITIAL_QUESTION_DELAY, () => {
      app.toQuestioning()
    })
  }

  const questioningInit = () => {
    const round = gameState.rounds[gameState.currentRound];
    const question = gameState.questions.find(
      (q) => q.id === round.questionId
    );
    if (question) {
      const words = question.text.split(" ");
      words.forEach((_, index) => {
        timeout(index * REVEAL_WORD_SPEED, () => {
          round.revealedWordsIndex = Math.max(round.revealedWordsIndex, index + 1);
          broadcastGameState(); // Broadcast after each word reveal
          if (round.revealedWordsIndex === words.length) {
            app.toAfterQuestioning();
          }
        });
      });
    }
  }

  const afterQuestioningInit = () => {
    timeout(WAIT_AFTER_QUESTION_TIME, () => {
      app.toShowingOptions();
    })
  }

  const showingOptionsInit = () => {
    timeout(OPTION_SELECTION_TIMEOUT, () => {
      app.toRevealingAnswer();
    })
  }

  const selectOption = (option: string, playerId: string) => {
    const currentRoundIndex = gameState.currentRound - 1;
    const round = gameState.rounds[currentRoundIndex];

    if (round) {
      if (round.chosenOptions instanceof Map) {
        round.chosenOptions.set(playerId, option);
      } else {
        round.chosenOptions[playerId] = option;
      }
    }
    broadcastGameState();
  }

  const revealingAnswerInit = () => {
    timeout(REVEAL_ANSWER_TIME, () => {
      app.toGivingPoints();
    })
  }

  const givingPointsInit = () => {
    const round = gameState.rounds[gameState.currentRound];
    const question = gameState.questions.find(
      (q) => q.id === round.questionId
    );

    if (question) {
      const correctAnswer = question.answer;

      // Give points to all players who selected the correct answer
      gameState.players.forEach((player) => {
        const playerChoice =
          round.chosenOptions instanceof Map
            ? round.chosenOptions.get(player.id)
            : round.chosenOptions[player.id];

        if (playerChoice === correctAnswer) {
          player.points += POINTS_PER_CORRECT_ANSWER;
          console.log(
            `Player ${player.name} got correct answer, points: ${player.points}`
          );
        }
      });
    }
    timeout(GIVE_POINTS_TIME, app.toFinishingRound);
  }

  const app = machine({
    lobby: { startGame },
    preQuestioning: { init: preQuestioningInit, resetGame },
    questioning: { init: questioningInit, resetGame },
    afterQuestioning: { init: afterQuestioningInit, resetGame },
    showingOptions: { init: showingOptionsInit, selectOption, resetGame },
    revealingAnswer: { init: revealingAnswerInit, resetGame },
    givingPoints: { init: givingPointsInit, resetGame },
    finishingRound: { resetGame },

  }, "lobby", () => {
    broadcastGameState();
  })

  return app;
}

export default class RoomServer implements Party.Server {
  private gameState: GameState;
  private connectionToPlayerMap: Map<string, string>; // Maps connection.id to player.id
  private messageReceived: (clientMessage: ClientMessage, sender: Party.Connection) => void;

  constructor(readonly room: Party.Room) {
    this.gameState = {
      roomId: room.id,
      players: new Map(),
      questions: questions,
      phase: "lobby",
      rounds: [],
      currentRound: 0,
    };
    this.connectionToPlayerMap = new Map();
    const app = boot(this.gameState, () => {
      this.gameState.phase = app.state;
      this.broadcastGameState()
    });
    this.messageReceived = (clientMessage: ClientMessage, sender: Party.Connection) => {
      switch (clientMessage.type) {
        case "startGame":
          app.startGame();
          break;
        case "selectOption":
          const playerId = this.connectionToPlayerMap.get(sender.id) || sender.id;
          app.selectOption(clientMessage.data.option, playerId);
          break;
        case "resetGame":
          app.resetGame();
          break;
        case "joinAsPlayer":
          if (clientMessage.data.name) {
            const truncatedName = clientMessage.data.name.substring(0, 20);
            const avatar = clientMessage.data.avatar || "robot-1";

            const playerId = clientMessage.data.connectionId || sender.id;
            this.connectionToPlayerMap.set(sender.id, playerId);

            const player: Player = {
              id: playerId,
              name: truncatedName,
              avatar: avatar,
              connectedAt: Date.now(),
              points: 0,
            };
            this.gameState.players.set(playerId, player);
            this.broadcastGameState();
          }
          break;
        case "changeProfile":
          if (clientMessage.data.name || clientMessage.data.avatar) {
            const playerId = clientMessage.data.connectionId || sender.id;
            console.log("Using playerId for profile change:", playerId);

            this.connectionToPlayerMap.set(sender.id, playerId);

            const existingPlayer = this.gameState.players.get(playerId);
            if (existingPlayer) {
              let updated = false;

              if (clientMessage.data.name) {
                const truncatedName = clientMessage.data.name.substring(0, 20);
                if (existingPlayer.name !== truncatedName) {
                  console.log(
                    "Updating player name:",
                    existingPlayer.name,
                    "->",
                    truncatedName
                  );
                  existingPlayer.name = truncatedName;
                  updated = true;
                }
              }

              if (clientMessage.data.avatar) {
                if (existingPlayer.avatar !== clientMessage.data.avatar) {
                  console.log(
                    "Updating player avatar:",
                    existingPlayer.avatar,
                    "->",
                    clientMessage.data.avatar
                  );
                  existingPlayer.avatar = clientMessage.data.avatar;
                  updated = true;
                }
              }

              if (updated) {
                this.gameState.players.set(playerId, existingPlayer);
                this.broadcastGameState();
              }
            } else {
              console.log("Creating new player from profile change");
              const name = clientMessage.data.name
                ? clientMessage.data.name.substring(0, 20)
                : "Player";
              const avatar = clientMessage.data.avatar || "robot-1";
              const player: Player = {
                id: playerId,
                name: name,
                avatar: avatar,
                connectedAt: Date.now(),
                points: 0,
              };
              this.gameState.players.set(playerId, player);

              this.broadcastGameState();
            }
          }
          break;
      }
    }

  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current game state to the new connection
    conn.send(
      JSON.stringify({
        type: "update",
        data: {
          ...this.gameState,
          players: Array.from(this.gameState.players.values()),
        },
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const clientMessage: ClientMessage = JSON.parse(message);
      this.messageReceived(clientMessage, sender);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  async onClose(connection: Party.Connection) {
    // Get the player ID for this connection
    const playerId = this.connectionToPlayerMap.get(connection.id);

    if (playerId) {
      // Remove the mapping
      this.connectionToPlayerMap.delete(connection.id);

      // Check if there are any other connections for this player
      const hasOtherConnections = Array.from(
        this.connectionToPlayerMap.values()
      ).includes(playerId);

      if (!hasOtherConnections) {
        // No other connections for this player, remove from game state
        this.gameState.players.delete(playerId);

        // Broadcast updated game state to all connections
        this.broadcastGameState();
      }
    }
  }

  private broadcastGameState() {
    this.room.broadcast(
      JSON.stringify({
        type: "update",
        data: {
          ...this.gameState,
          players: Array.from(this.gameState.players.values()),
          rounds: this.gameState.rounds.map((round) => ({
            ...round,
            chosenOptions:
              round.chosenOptions instanceof Map
                ? Object.fromEntries(round.chosenOptions)
                : round.chosenOptions,
          })),
        },
      })
    );
  }
}
