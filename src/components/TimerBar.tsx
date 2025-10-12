import React from "react";
import { motion } from "framer-motion";

interface TimerBarProps {
  timeRemaining: number;
  isPlayerMode?: boolean;
}

export function TimerBar({ timeRemaining, isPlayerMode = false }: TimerBarProps) {
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
