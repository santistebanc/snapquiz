import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface TimerBarProps {
  isPlayerMode?: boolean;
}

export function TimerBar({ isPlayerMode = false }: TimerBarProps) {
  const { gameState } = useGameStore();
  const [timeRemaining, setTimeRemaining] = useState<number>(3000);

  // Handle server messages for timer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "timerCountdown") {
          setTimeRemaining(message.data.timeRemaining);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    // Listen for messages from the game store's socket
    const socket = (useGameStore.getState() as any).socket;
    if (socket) {
      socket.addEventListener("message", handleMessage);
      return () => socket.removeEventListener("message", handleMessage);
    }
  }, []);

  // Reset timer when round changes
  useEffect(() => {
    setTimeRemaining(3000);
  }, [gameState.currentRound]);

  const progress = ((3000 - timeRemaining) / 3000) * 100;
  
  return (
    <div className="flex justify-center">
      <div className={`bg-gray-200 rounded-full overflow-hidden ${
        isPlayerMode ? "w-64 h-3" : "w-80 h-4"
      }`}>
        <motion.div 
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 0.1, 
            ease: "linear" 
          }}
        />
      </div>
    </div>
  );
}
