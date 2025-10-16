import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useGameStore } from "../store";

interface OptionsDisplayProps {
  isPlayerMode?: boolean;
}

export function OptionsDisplay({ isPlayerMode = false }: OptionsDisplayProps) {
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
  const disabled = ['revealingAnswer', 'givingPoints', 'finishingRound'].includes(gameState.phase);
  const isInteractive = isPlayerMode; // Only interactive in player mode


  // Get players who selected the correct answer (only for screen mode)
  const correctPlayers =
    !isPlayerMode && currentRound && disabled
      ? Object.values(gameState.players).filter((player) => {
        const playerChoice = currentRound.chosenOptions[player.id];
        return playerChoice === correctAnswer;
      })
      : [];

  // Get player's selected option from server state (only for player mode)
  const selectedOption =
    isPlayerMode && currentRound && connectionId
      ? currentRound.chosenOptions[connectionId]
      : null;

  // Handle option selection (only for player mode)
  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode) return;

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
            delay: index * 0.1,
          }}
          whileHover={isInteractive ? { scale: 1.02 } : {}}
          whileTap={isInteractive ? { scale: 0.98 } : {}}
          className="relative"
        >
          <Button
            onClick={
              isInteractive ? () => handleOptionSelect(option) : undefined
            }
            variant={selectedOption === option ? "default" : "outline"}
            className={`w-full text-lg p-4 h-auto transition-colors duration-300 ${isInteractive ? "" : "cursor-default pointer-events-none"
              } ${getOptionStyle(option)}`}
            disabled={isInteractive ? disabled : false}
          >
            {option}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
