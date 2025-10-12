import type * as Party from "partykit/server";
import type { GameState, Player, ServerMessage, ClientMessage, Round } from "./types";
import { Phase } from "./types";
import { questions } from "./questions";

// Timing constants
const QUESTION_REVEAL_TIME = 2000; // 2 seconds
const WAIT_AFTER_QUESTION_TIME = 3000; // 3 seconds
const TIMER_UPDATE_INTERVAL = 100; // 100ms (tenth of a second)
const OPTION_SELECTION_TIMEOUT = 3000; // 3 seconds after first selection

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
      revealedWordsIndex: 0,
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
                const avatar = clientMessage.data.avatar || 'robot-1';

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
              console.log('Received changeProfile:', clientMessage.data);
              if (clientMessage.data.name || clientMessage.data.avatar) {
                // Use connectionId if provided, otherwise fall back to sender.id
                const playerId = clientMessage.data.connectionId || sender.id;
                console.log('Using playerId for profile change:', playerId);
                
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
                      console.log('Updating player name:', existingPlayer.name, '->', truncatedName);
                      existingPlayer.name = truncatedName;
                      updated = true;
                    }
                  }
                  
                  // Update avatar if provided
                  if (clientMessage.data.avatar) {
                    if (existingPlayer.avatar !== clientMessage.data.avatar) {
                      console.log('Updating player avatar:', existingPlayer.avatar, '->', clientMessage.data.avatar);
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
                  console.log('Creating new player from profile change');
                  // Create new player if doesn't exist
                  const name = clientMessage.data.name ? clientMessage.data.name.substring(0, 20) : 'Player';
                  const avatar = clientMessage.data.avatar || 'robot-1';
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
              console.log('Starting game');
              // Create rounds for each question
              this.gameState.rounds = this.gameState.questions.map(question => ({
                questionId: question.id,
                chosenOptions: new Map<string, string>()
              }));
              this.gameState.currentRound = 1;
              this.gameState.revealedWordsIndex = 0;
              this.gameState.phase = Phase.QUESTIONING;
              this.broadcastGameState();
              
              // Start the question reveal process for the first round
              this.startQuestionReveal(0);
              break;

            case "selectOption":
              console.log('Received selectOption:', clientMessage.data);
              if (clientMessage.data.option) {
                // Use connectionId if provided, otherwise fall back to sender.id
                const playerId = clientMessage.data.connectionId || sender.id;
                console.log('Using playerId:', playerId, 'for option:', clientMessage.data.option);
                
                // Get current round
                const currentRoundIndex = this.gameState.currentRound - 1;
                if (currentRoundIndex >= 0 && currentRoundIndex < this.gameState.rounds.length) {
                  const round = this.gameState.rounds[currentRoundIndex];
                  
                  // Update the chosen option for this player
                  if (round.chosenOptions instanceof Map) {
                    round.chosenOptions.set(playerId, clientMessage.data.option);
                    console.log('Updated Map chosenOptions:', Object.fromEntries(round.chosenOptions));
                  } else {
                    round.chosenOptions[playerId] = clientMessage.data.option;
                    console.log('Updated object chosenOptions:', round.chosenOptions);
                  }
                  
                  // If this is the first selection and we're still in showingOptions phase, start the timeout
                  const chosenOptionsSize = round.chosenOptions instanceof Map 
                    ? round.chosenOptions.size 
                    : Object.keys(round.chosenOptions).length;
                  
                  if (this.gameState.phase === Phase.SHOWING_OPTIONS && chosenOptionsSize === 1) {
                    const timeoutKey = `option_timeout_${currentRoundIndex}`;
                    
                    // Clear any existing timeout for this round
                    const existingTimeout = this.timeouts.get(timeoutKey);
                    if (existingTimeout) {
                      clearTimeout(existingTimeout);
                    }
                    
                    // Set new timeout to transition to revealingAnswer
                    const timeout = setTimeout(() => {
                      this.gameState.phase = Phase.REVEALING_ANSWER;
                      this.broadcastGameState();
                      this.timeouts.delete(timeoutKey);
                    }, OPTION_SELECTION_TIMEOUT);
                    
                    this.timeouts.set(timeoutKey, timeout);
                  }
                  
                  // Broadcast updated game state
                  this.broadcastGameState();
                }
              }
              break;

            case "resetGame":
              console.log('Resetting game');
              // Clear all timeouts
              this.timeouts.forEach(timeout => clearTimeout(timeout));
              this.timeouts.clear();
              
              this.gameState.phase = Phase.LOBBY;
              this.gameState.rounds = [];
              this.gameState.currentRound = 0;
              this.gameState.revealedWordsIndex = 0;
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
      const hasOtherConnections = Array.from(this.connectionToPlayerMap.values()).includes(playerId);
      
      if (!hasOtherConnections) {
        // No other connections for this player, remove from game state
        this.gameState.players.delete(playerId);
        
        // Broadcast updated game state to all connections
        this.broadcastGameState();
      }
    }
  }

  private broadcastGameState() {
    this.room.broadcast(JSON.stringify({
      type: "update",
      data: {
        ...this.gameState,
        players: Array.from(this.gameState.players.values()),
        rounds: this.gameState.rounds.map(round => ({
          ...round,
          chosenOptions: round.chosenOptions instanceof Map 
            ? Object.fromEntries(round.chosenOptions)
            : round.chosenOptions
        }))
      },
    }));
  }

  private startQuestionReveal(roundIndex: number) {
    if (roundIndex >= 0 && roundIndex < this.gameState.rounds.length) {
      const round = this.gameState.rounds[roundIndex];
      const question = this.gameState.questions.find(q => q.id === round.questionId);
      
      if (question) {
        const words = question.text.split(' ');
        const wordInterval = QUESTION_REVEAL_TIME / words.length;
        const initialDelay = 1000; // 1 second delay before first word
        
        // Update revealedWordsIndex and broadcast game state
        words.forEach((word, index) => {
          const timeout = setTimeout(() => {
            this.gameState.revealedWordsIndex = index + 1;
            this.broadcastGameState();
          }, initialDelay + (index * wordInterval));
          
          this.timeouts.set(`word_${roundIndex}_${index}`, timeout);
        });
        
        // Transition to waitAfterQuestion after all words are revealed
        const finalTimeout = setTimeout(() => {
          this.gameState.phase = Phase.WAIT_AFTER_QUESTION;
          this.broadcastGameState();
          this.startWaitAfterQuestion(roundIndex);
        }, initialDelay + QUESTION_REVEAL_TIME);
        
        this.timeouts.set(`question_end_${roundIndex}`, finalTimeout);
      }
    }
  }

  private startWaitAfterQuestion(roundIndex: number) {
    if (roundIndex >= 0 && roundIndex < this.gameState.rounds.length) {
      // Send countdown messages every 100ms for smooth animation
      const totalUpdates = WAIT_AFTER_QUESTION_TIME / TIMER_UPDATE_INTERVAL;
      
      for (let i = 0; i < totalUpdates; i++) {
        const timeout = setTimeout(() => {
          const timeRemaining = WAIT_AFTER_QUESTION_TIME - (i * TIMER_UPDATE_INTERVAL);
          const secondsRemaining = Math.ceil(timeRemaining / 1000);
          
          this.room.broadcast(JSON.stringify({
            type: "timerCountdown",
            data: {
              roundIndex,
              secondsRemaining: Math.max(0, secondsRemaining),
              timeRemaining: Math.max(0, timeRemaining)
            }
          }));
        }, i * TIMER_UPDATE_INTERVAL);
        
        this.timeouts.set(`timer_${roundIndex}_${i}`, timeout);
      }
      
        // Transition to showingOptions after countdown
        const finalTimeout = setTimeout(() => {
          this.gameState.phase = Phase.SHOWING_OPTIONS;
          this.broadcastGameState();
        }, WAIT_AFTER_QUESTION_TIME);
      
      this.timeouts.set(`wait_end_${roundIndex}`, finalTimeout);
    }
  }

}
