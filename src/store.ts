import { create } from "zustand";
import PartySocket from "partysocket";
import type { ServerState, ServerMessage } from "./types";
import { getStoredConnectionId, setStoredConnectionId, setStoredPlayerName, setStoredPlayerAvatar, setStoredRoomId } from "./utils";
import { initialState } from "./serverState";

export type View = 'lobby' | 'setup' | 'game';

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
  serverState: ServerState;
  view: View;
  isConnected: boolean;
  isPlayer: boolean;
  socket: PartySocket | null;
  connectionId: string;

  // Actions
  setView: (view: View) => void;
  updateServerState: (updates: Partial<ServerState>) => void;
  connect: (roomId: string, isPlayer: boolean, name?: string, avatar?: string) => void;
  disconnect: () => void;
  serverAction: (action: string, ...args: any[]) => void;
  handleServerMessage: (message: ServerMessage) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  serverState: { ...initialState, phase: "loading" },
  view: 'game',
  isConnected: false,
  isPlayer: false,
  socket: null,
  connectionId: "",

  // Game state actions (now handled by server game state updates)

  updateServerState: (updates) =>
    set((state) => ({
      serverState: { ...state.serverState, ...updates },
    })),

  setView: (view) => set({ view }),

  // Connection actions
  connect: (roomId, isPlayer, name, avatar) => {
    const { socket } = get();

    // Close existing connection
    socket?.close();

    // Get or generate connectionId
    const storedConnectionId = getStoredConnectionId();
    const connectionId = storedConnectionId || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!storedConnectionId) setStoredConnectionId(connectionId);

    // Create new connection
    const newSocket = new PartySocket({
      host: getPartyKitHost(),
      room: roomId,
      party: "room",
    });

    // Set up event listeners
    newSocket.addEventListener("open", () => {
      set({ isConnected: true, connectionId });
      newSocket.send(JSON.stringify({
        type: 'action',
        data: isPlayer ? { action: isPlayer ? "joinAsPlayer" : "joinAsScreen", args: [connectionId, name, avatar] } : { action: "joinAsScreen", args: [connectionId] },
      }));
    });

    newSocket.addEventListener("message", (event) => {
      try {
        get().handleServerMessage(JSON.parse(event.data));
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    newSocket.addEventListener("close", () => set({ isConnected: false }));
    newSocket.addEventListener("error", (event) => console.error("WebSocket error:", event));

    set({ socket: newSocket, serverState: { ...get().serverState, roomId }, isPlayer });
  },

  disconnect: () => {
    get().socket?.close();
    set({
      socket: null,
      isConnected: false,
      connectionId: "",
      serverState: initialState,
    });
  },

  serverAction: (action, ...args) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'action', data: { action, args } }));
    }
  },

  // Message handlers
  handleServerMessage: (message) => {
    if (message.type === "update") {
      const newServerState = message.data;

      // Update localStorage
      if (newServerState.roomId) setStoredRoomId(newServerState.roomId);

      const { isPlayer, connectionId } = get();
      if (isPlayer && connectionId) {
        const currentPlayer = newServerState.players[connectionId];
        if (currentPlayer?.name) setStoredPlayerName(currentPlayer.name);
        if (currentPlayer?.avatar) setStoredPlayerAvatar(currentPlayer.avatar);
      }

      set({ serverState: newServerState });
    }
  },
}));

// Helper to get current player
const useCurrentPlayer = () => {
  const { serverState, isPlayer, connectionId } = useGameStore();
  if (!isPlayer || !connectionId) return null;
  return serverState.players[connectionId] || null;
};

// Selector to get current player name
export const useCurrentPlayerName = () => useCurrentPlayer()?.name || "";

// Selector to get current player avatar
export const useCurrentPlayerAvatar = () => useCurrentPlayer()?.avatar || "";
