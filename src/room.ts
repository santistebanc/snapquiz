import type * as Party from "partykit/server";
import type { GameState, Player, ServerMessage, ClientMessage } from "./types";

export default class RoomServer implements Party.Server {
  private gameState: GameState;
  private connectionToPlayerMap: Map<string, string>; // Maps connection.id to player.id

  constructor(readonly room: Party.Room) {
    this.gameState = {
      roomId: room.id,
      players: new Map(),
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
                };

                // Add player to game state using the playerId
                this.gameState.players.set(playerId, player);

                // Broadcast updated game state to all connections
                this.broadcastGameState();
              }
              break;

            case "changePlayerName":
              console.log('Received changePlayerName:', clientMessage.data);
              if (clientMessage.data.name) {
                // Truncate name to 20 characters
                const truncatedName = clientMessage.data.name.substring(0, 20);

                // Use connectionId if provided, otherwise fall back to sender.id
                const playerId = clientMessage.data.connectionId || sender.id;
                console.log('Using playerId:', playerId);
                
                // Map this connection to the player ID
                this.connectionToPlayerMap.set(sender.id, playerId);
                
                // Check if player exists
                const existingPlayer = this.gameState.players.get(playerId);
                if (existingPlayer) {
                  console.log('Updating existing player:', existingPlayer.name, '->', truncatedName);
                  // Update the player's name
                  existingPlayer.name = truncatedName;
                  this.gameState.players.set(playerId, existingPlayer);
                } else {
                  console.log('Creating new player:', truncatedName);
                  // Create new player if doesn't exist
                  // Use avatar from message if provided, otherwise default to robot-1
                  const avatar = clientMessage.data.avatar || 'robot-1';
                  const player: Player = {
                    id: playerId,
                    name: truncatedName,
                    avatar: avatar,
                    connectedAt: Date.now(),
                  };
                  this.gameState.players.set(playerId, player);
                }
                
                console.log('Current players:', Array.from(this.gameState.players.entries()));
                
                // Broadcast updated game state to all connections
                this.broadcastGameState();
              }
              break;

            case "changePlayerAvatar":
              console.log('Received changePlayerAvatar:', clientMessage.data);
              if (clientMessage.data.avatar) {
                // Use connectionId if provided, otherwise fall back to sender.id
                const playerId = clientMessage.data.connectionId || sender.id;
                console.log('Using playerId for avatar change:', playerId);
                
                // Map this connection to the player ID
                this.connectionToPlayerMap.set(sender.id, playerId);
                
                // Check if player exists
                const existingPlayer = this.gameState.players.get(playerId);
                if (existingPlayer) {
                  console.log('Updating player avatar:', existingPlayer.avatar, '->', clientMessage.data.avatar);
                  // Update the player's avatar
                  existingPlayer.avatar = clientMessage.data.avatar;
                  this.gameState.players.set(playerId, existingPlayer);
                  
                  // Broadcast updated game state to all connections
                  this.broadcastGameState();
                } else {
                  console.log('Player not found for avatar change');
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
      },
    }));
  }

  private broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }
}
