import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useGameStore } from "../store";
import { Phase } from "../types";

interface OptionsDisplayProps {
  isPlayerMode?: boolean;
}

export function OptionsDisplay({ 
  isPlayerMode = false
}: OptionsDisplayProps) {
  const { gameState, sendMessage, connectionId } = useGameStore();

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const currentQuestion = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  if (!currentQuestion) return null;

  const options = currentQuestion.options;
  const correctAnswer = currentQuestion.answer;
  const disabled = gameState.phase === Phase.REVEALING_ANSWER;
  const isRevealingAnswer = gameState.phase === Phase.REVEALING_ANSWER;

  // Get player's selected option from server state (only for player mode)
  const selectedOption =
    isPlayerMode && currentRound && connectionId
      ? currentRound.chosenOptions instanceof Map
        ? currentRound.chosenOptions.get(connectionId)
        : currentRound.chosenOptions[connectionId]
      : null;

  // For screen mode during answer reveal: reorder options and get player selections
  const displayOptions = isRevealingAnswer && !isPlayerMode
    ? [correctAnswer, ...options.filter(option => option !== correctAnswer)]
    : options;

  // Get players who selected each option (for screen mode during reveal)
  const getPlayersForOption = (option: string) => {
    if (isPlayerMode || !isRevealingAnswer || !currentRound) return [];
    
    const players = Array.from(gameState.players.values());
    return players.filter(player => {
      const chosenOptions = currentRound.chosenOptions instanceof Map
        ? currentRound.chosenOptions
        : new Map(Object.entries(currentRound.chosenOptions));
      return chosenOptions.get(player.id) === option;
    });
  };

  // Handle option selection (only for player mode)
  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode) return;
    
    console.log("Player selecting option:", option);
    console.log(
      "Sending selectOption message with connectionId:",
      connectionId
    );
    sendMessage({
      type: "selectOption",
      data: {
        option: option,
        connectionId: connectionId,
      },
    });
  };
  const getOptionStyle = (option: string) => {
    if (disabled) {
      // Answer reveal mode
      if (option === correctAnswer) {
        return "bg-green-500 text-white border-green-500";
      } else if (selectedOption === option) {
        return "bg-red-500 text-white border-red-500";
      } else {
        return "bg-gray-100 text-gray-900";
      }
    } else {
      // Selection mode
      if (selectedOption === option) {
        return "bg-blue-600 text-white border-blue-600";
      } else {
        return "bg-gray-100 text-gray-900 hover:bg-gray-200";
      }
    }
  };

  return (
    <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
      {displayOptions.map((option, index) => {
        const playersForOption = getPlayersForOption(option);
        const isCorrectAnswer = option === correctAnswer;
        
        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: index * 0.1
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-2">
              <Button
                onClick={() => handleOptionSelect(option)}
                variant={selectedOption === option ? "default" : "outline"}
                className={`w-full text-lg p-4 h-auto transition-colors duration-300 ${getOptionStyle(option)}`}
                disabled={disabled}
              >
                {option}
              </Button>
              
              {/* Show players who selected this option (screen mode only during reveal) */}
              {!isPlayerMode && isRevealingAnswer && playersForOption.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {playersForOption.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isCorrectAnswer
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <img
                        src={`/avatars/${player.avatar}.svg`}
                        alt={player.name}
                        className="w-4 h-4 rounded-full"
                      />
                      <span>{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
