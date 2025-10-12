import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useGameStore } from "../store";
import { Phase } from "../types";
import { generateAvatarUrl } from "../utils";

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

  // Get players who selected the correct answer (only for screen mode)
  const correctPlayers = !isPlayerMode && currentRound && disabled
    ? Array.from(gameState.players.values()).filter(player => {
        const playerChoice = currentRound.chosenOptions instanceof Map
          ? currentRound.chosenOptions.get(player.id)
          : currentRound.chosenOptions[player.id];
        return playerChoice === correctAnswer;
      })
    : [];

  // Get player's selected option from server state (only for player mode)
  const selectedOption =
    isPlayerMode && currentRound && connectionId
      ? currentRound.chosenOptions instanceof Map
        ? currentRound.chosenOptions.get(connectionId)
        : currentRound.chosenOptions[connectionId]
      : null;

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
      {options.map((option, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: index * 0.1
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <Button
            onClick={() => handleOptionSelect(option)}
            variant={selectedOption === option ? "default" : "outline"}
            className={`w-full text-lg p-4 h-auto transition-colors duration-300 ${getOptionStyle(option)}`}
            disabled={disabled}
          >
            {option}
          </Button>
          
          {/* Show correct players under the correct answer (screen mode only) */}
          {!isPlayerMode && disabled && option === correctAnswer && correctPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 z-10"
            >
              <Card className="bg-white shadow-lg border-2 border-green-500">
                <CardContent className="p-3">
                  <div className="text-sm font-medium text-green-700 mb-2 text-center">
                    Correct Answer!
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {correctPlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-200"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={generateAvatarUrl(player.avatar)}
                            alt={player.name}
                          />
                        </Avatar>
                        <span className="text-xs font-medium text-green-800 truncate max-w-20">
                          {player.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
