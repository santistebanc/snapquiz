import React from "react";

interface TimerBarProps {
  timeRemaining: number;
  isPlayerMode?: boolean;
}

export function TimerBar({ timeRemaining, isPlayerMode = false }: TimerBarProps) {
  return (
    <div className="flex justify-center">
      <div className={`bg-gray-200 rounded-full overflow-hidden ${
        isPlayerMode ? "w-64 h-3" : "w-80 h-4"
      }`}>
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${((3000 - timeRemaining) / 3000) * 100}%` }}
        />
      </div>
    </div>
  );
}
