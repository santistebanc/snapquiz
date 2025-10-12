import type * as Party from "partykit/server";
import type {
  GameState,
  Player,
  ServerMessage,
  ClientMessage,
  Round,
} from "./types";
import { Phase } from "./types";
import { questions } from "./questions";

// Timing constants
const REVEAL_WORD_SPEED = 100; // 100ms
const INITIAL_QUESTION_DELAY = 1000; // 1 second delay before first word
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds after question reveal
const OPTION_SELECTION_TIMEOUT = 5000; // 5 seconds after options reveal

export default class RoomServer implements Party.Server {
  private gameState: GameState;
  private connectionToPlayerMap: Map<string, string>; // Maps connection.id to player.id
  private timeouts: Map<string, NodeJS.Timeout> = new Map(); // Track active timeouts

  constructor(readonly room: Party.Room) {
    this.gameState = {
      roomId: room.id,
      players: new Map(),
      questions: questions,
      phase: Phase.LOBBY,
      rounds: [],
      currentRound: 0,
    };
    this.connectionToPlayerMap = new Map();
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

      switch (clientMessage.type) {
        case "joinAsPlayer":
          if (clientMessage.data.name) {
            // Truncate name to 20 characters
            const truncatedName = clientMessage.data.name.substring(0, 20);
            const avatar = clientMessage.data.avatar || "robot-1";

            // Use connectionId if provided, otherwise fall back to sender.id
            const playerId = clientMessage.data.connectionId || sender.id;

            // Map this connection to the player ID
            this.connectionToPlayerMap.set(sender.id, playerId);

            const player: Player = {
              id: playerId,
              name: truncatedName,
              avatar: avatar,
              connectedAt: Date.now(),
              points: 0,
            };

            // Add player to game state using the playerId
            this.gameState.players.set(playerId, player);

            // Broadcast updated game state to all connections
            this.broadcastGameState();
          }
          break;

        case "changeProfile":
          console.log("Received changeProfile:", clientMessage.data);
          if (clientMessage.data.name || clientMessage.data.avatar) {
            // Use connectionId if provided, otherwise fall back to sender.id
            const playerId = clientMessage.data.connectionId || sender.id;
            console.log("Using playerId for profile change:", playerId);

            // Map this connection to the player ID
            this.connectionToPlayerMap.set(sender.id, playerId);

            // Check if player exists
            const existingPlayer = this.gameState.players.get(playerId);
            if (existingPlayer) {
              let updated = false;

              // Update name if provided
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

              // Update avatar if provided
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
                // Broadcast updated game state to all connections
                this.broadcastGameState();
              }
            } else {
              console.log("Creating new player from profile change");
              // Create new player if doesn't exist
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

              // Broadcast updated game state to all connections
              this.broadcastGameState();
            }
          }
          break;

        case "joinAsScreen":
          // this.broadcast({
          //   type: "update",
          //   data: {
          //     ...this.gameState,
          //     players: Array.from(this.gameState.players.values())
          //   },
          // });
          break;

        case "startGame":
          console.log("Starting game");
          // Create rounds for each question
          this.gameState.rounds = this.gameState.questions.map((question) => ({
            questionId: question.id,
            chosenOptions: new Map<string, string>(),
            revealedWordsIndex: 0,
          }));
          this.gameState.currentRound = 1;
          this.gameState.phase = Phase.QUESTIONING;
          this.broadcastGameState();

          // Start the question reveal process for the first round
          this.startQuestionReveal(0);
          break;

        case "selectOption":
          console.log("Received selectOption:", clientMessage.data);
          if (clientMessage.data.option) {
            // Use connectionId if provided, otherwise fall back to sender.id
            const playerId = clientMessage.data.connectionId || sender.id;
            console.log(
              "Using playerId:",
              playerId,
              "for option:",
              clientMessage.data.option
            );

            // Get current round
            const currentRoundIndex = this.gameState.currentRound - 1;
            if (
              currentRoundIndex >= 0 &&
              currentRoundIndex < this.gameState.rounds.length
            ) {
              const round = this.gameState.rounds[currentRoundIndex];

              // Update the chosen option for this player
              if (round.chosenOptions instanceof Map) {
                round.chosenOptions.set(playerId, clientMessage.data.option);
                console.log(
                  "Updated Map chosenOptions:",
                  Object.fromEntries(round.chosenOptions)
                );
              } else {
                round.chosenOptions[playerId] = clientMessage.data.option;
                console.log(
                  "Updated object chosenOptions:",
                  round.chosenOptions
                );
              }

              // Broadcast updated game state
              this.broadcastGameState();
            }
          }
          break;

        case "resetGame":
          console.log("Resetting game");
          
          // Clear all active timeouts (word reveal, option selection, etc.)
          this.timeouts.forEach((timeout) => clearTimeout(timeout));
          this.timeouts.clear();

          // Reset game state variables
          this.gameState.phase = Phase.LOBBY;
          this.gameState.rounds = [];
          this.gameState.currentRound = 0;
          
          // Reset player points to 0
          this.gameState.players.forEach((player) => {
            player.points = 0;
          });
          
          // Note: connectionToPlayerMap is intentionally NOT cleared
          // to maintain player connections across game resets
          
          this.broadcastGameState();
          break;
      }
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

  private startQuestionReveal(roundIndex: number) {
    if (roundIndex >= 0 && roundIndex < this.gameState.rounds.length) {
      const round = this.gameState.rounds[roundIndex];
      const question = this.gameState.questions.find(
        (q) => q.id === round.questionId
      );

        if (question) {
          const words = question.text.split(" ");

        // Update current round's revealedWordsIndex and broadcast game state
        words.forEach((_, index) => {
          const timeout = setTimeout(() => {
            if (this.gameState.rounds[roundIndex]) {
              this.gameState.rounds[roundIndex].revealedWordsIndex = Math.max(
                this.gameState.rounds[roundIndex].revealedWordsIndex,
                index + 1
              );
              this.broadcastGameState();
            }
          }, INITIAL_QUESTION_DELAY + index * REVEAL_WORD_SPEED);

          this.timeouts.set(`word_${roundIndex}_${index}`, timeout);
        });

        // Wait 3 seconds after question reveal, then transition to showingOptions
        const finalTimeout = setTimeout(() => {
          this.gameState.phase = Phase.SHOWING_OPTIONS;
          this.broadcastGameState();
          
          // Start timeout for REVEALING_ANSWER transition
          const revealTimeoutKey = `reveal_timeout_${roundIndex}`;
          const revealTimeout = setTimeout(() => {
            console.log('Transitioning to REVEALING_ANSWER phase');
            this.gameState.phase = Phase.REVEALING_ANSWER;
            this.broadcastGameState();
            this.timeouts.delete(revealTimeoutKey);
            
            // Start timeout for GIVING_POINTS transition (3 seconds after reveal)
            const pointsTimeoutKey = `points_timeout_${roundIndex}`;
            const pointsTimeout = setTimeout(() => {
              console.log('Transitioning to GIVING_POINTS phase');
              this.gameState.phase = Phase.GIVING_POINTS;
              this.givePointsToCorrectPlayers(roundIndex);
              this.broadcastGameState();
              this.timeouts.delete(pointsTimeoutKey);
            }, 3000); // 3 seconds delay to show answer highlighting
            
            this.timeouts.set(pointsTimeoutKey, pointsTimeout);
          }, OPTION_SELECTION_TIMEOUT);
          
          this.timeouts.set(revealTimeoutKey, revealTimeout);
        }, INITIAL_QUESTION_DELAY + (words.length * REVEAL_WORD_SPEED) + WAIT_AFTER_QUESTION_TIME);

        this.timeouts.set(`question_end_${roundIndex}`, finalTimeout);
      }
    }
  }

  private givePointsToCorrectPlayers(roundIndex: number) {
    if (roundIndex >= 0 && roundIndex < this.gameState.rounds.length) {
      const round = this.gameState.rounds[roundIndex];
      const question = this.gameState.questions.find(q => q.id === round.questionId);
      
      if (question) {
        const correctAnswer = question.answer;
        
        // Give 10 points to all players who selected the correct answer
        this.gameState.players.forEach((player) => {
          const playerChoice = round.chosenOptions instanceof Map
            ? round.chosenOptions.get(player.id)
            : round.chosenOptions[player.id];
          
          if (playerChoice === correctAnswer) {
            player.points += 10;
            console.log(`Player ${player.name} got correct answer, points: ${player.points}`);
          }
        });
      }
    }
  }

}
