import { useEffect } from "react";
import { useGameStore } from "./store";
import { getRoomId, getPlayerName } from "./utils";

export function useGameConnection() {
  const { gameState, isConnected, isPlayer, connect, disconnect } =
    useGameStore();

  // Initialize connection and determine mode
  useEffect(() => {
    const roomId = getRoomId();
    const name = getPlayerName();
    const urlParams = new URLSearchParams(window.location.search);
    
    // Determine mode: 
    // - Screen mode if as=screen OR no URL params at all
    // - Player mode if roomId is present AND as=screen is not present
    const hasRoomId = !!urlParams.get("roomId");
    const isScreenParam = urlParams.get("as") === "screen";
    const isPlayer = hasRoomId && !isScreenParam;

    // Connect to the room
    connect(roomId, isPlayer, name);

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    gameState,
    isConnected,
    isPlayer,
  };
}
