import { create } from "zustand";
import PartySocket from "partysocket";
import type { GameState, Player, ServerMessage } from "./types";
import { Phase } from "./types";
import { getStoredConnectionId, setStoredConnectionId, setStoredPlayerName, setStoredPlayerAvatar, setStoredRoomId } from "./utils";

// Get PartyKit host from environment variable
function getPartyKitHost(): string {
  // In production, use the current host
  if (window.location.hostname !== "localhost") {
    return window.location.host;
  }

  // In development, use VITE_PARTYKIT_PORT environment variable
  const envPort = (window as any).VITE_PARTYKIT_PORT;
  if (envPort) {
    return `localhost:${envPort}`;
  }

  // Fallback to default PartyKit development port
  return `localhost:37011`;
}

interface GameStore {
  // State
  gameState: GameState;
  isConnected: boolean;
  isPlayer: boolean;
  socket: PartySocket | null;
  connectionId: string;

  updateGameState: (updates: Partial<GameState>) => void;
  connect: (roomId: string, isPlayer: boolean, name?: string, avatar?: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  handleServerMessage: (message: ServerMessage) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: {
    roomId: "",
    players: new Map(),
    questions: [],
    phase: Phase.LOBBY,
    rounds: [],
    currentRound: 0,
  },
  isConnected: false,
  isPlayer: false,
  socket: null,
  connectionId: "",

  // Game state actions (now handled by server game state updates)

  updateGameState: (updates) =>
    set((state) => ({
      gameState: { ...state.gameState, ...updates },
    })),

  // Connection actions
      connect: (roomId, isPlayer, name, avatar) => {
        const { socket } = get();

        // Close existing connection
        if (socket) {
          socket.close();
        }

        // Get stored connectionId or generate new one
        const storedConnectionId = getStoredConnectionId();
        const connectionId = storedConnectionId || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store the connectionId if it's new
        if (!storedConnectionId) {
          setStoredConnectionId(connectionId);
        }

        // Create new connection
        const newSocket = new PartySocket({
          host: getPartyKitHost(),
          room: roomId,
          party: "room",
        });

        newSocket.addEventListener("open", () => {
          set({ isConnected: true, connectionId });
          console.log("Connected to room:", roomId, "with connectionId:", connectionId);

          // Send join message with connectionId
          const message = {
            type: isPlayer ? "joinAsPlayer" : "joinAsScreen",
            data: isPlayer ? { name, avatar, connectionId } : { connectionId },
          };
          newSocket.send(JSON.stringify(message));
        });

        newSocket.addEventListener("message", (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            get().handleServerMessage(message);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        });

        newSocket.addEventListener("close", () => {
          set({ isConnected: false });
          console.log("Disconnected from room");
        });

        newSocket.addEventListener("error", (event) => {
          console.error("WebSocket error:", event);
        });

        set({
          socket: newSocket,
          gameState: { ...get().gameState, roomId },
          isPlayer: isPlayer,
        });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({
      socket: null,
      isConnected: false,
      connectionId: "",
      gameState: { roomId: "", players: new Map(), questions: [], phase: Phase.LOBBY, rounds: [], currentRound: 0 },
    });
  },

  sendMessage: (message) => {
    const { socket } = get();
    console.log('sendMessage called with:', message);
    console.log('socket readyState:', socket?.readyState);
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('Sending message to server:', JSON.stringify(message));
      socket.send(JSON.stringify(message));
    } else {
      console.log('Socket not ready, message not sent');
    }
  },

  // Message handlers
  handleServerMessage: (message) => {
    switch (message.type) {
      case "update":
        const newGameState = {
          ...message.data,
          players: new Map(
            message.data.players.map((player: Player) => [player.id, player])
          ),
        };
        
        // Update localStorage when game state changes
        if (newGameState.roomId) {
          setStoredRoomId(newGameState.roomId);
        }
        
        // Update player name and avatar in localStorage if this is a player connection
        const { isPlayer, connectionId } = get();
        if (isPlayer && connectionId) {
          const currentPlayer = newGameState.players.get(connectionId);
          if (currentPlayer?.name) {
            setStoredPlayerName(currentPlayer.name);
          }
          if (currentPlayer?.avatar) {
            setStoredPlayerAvatar(currentPlayer.avatar);
          }
        }
        
        set({
          gameState: newGameState,
        });
        break;
    }
  },
}));

// Selector to get current player name
export const useCurrentPlayerName = () => {
  const { gameState, isPlayer, connectionId } = useGameStore();

  if (!isPlayer || !connectionId) return "";

  // Find the player that matches our connection ID
  const currentPlayer = gameState.players.get(connectionId);

  return currentPlayer?.name || "";
};

// Selector to get current player avatar
export const useCurrentPlayerAvatar = () => {
  const { gameState, isPlayer, connectionId } = useGameStore();

  if (!isPlayer || !connectionId) return "";

  // Find the player that matches our connection ID
  const currentPlayer = gameState.players.get(connectionId);

  return currentPlayer?.avatar || "";
};
