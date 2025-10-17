import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useGameStore } from "../store";

interface OptionsDisplayProps {
  isPlayerMode?: boolean;
}

export function OptionsDisplay({ isPlayerMode = false }: OptionsDisplayProps) {
  const { gameState, serverAction, connectionId } = useGameStore();

  const currentRound = gameState.rounds[gameState.currentRound - 1]
  const currentQuestion = currentRound ? gameState.questions.find(q => q.id === currentRound.questionId) : null;

  if (!currentQuestion) return null;

  const { options, answer: correctAnswer } = currentQuestion;
  const disabled = ['revealingAnswer', 'givingPoints', 'finishingRound', 'transitioningNextRound'].includes(gameState.phase);
  const isInteractive = isPlayerMode;

  // Get correct players (screen mode only)
  const correctPlayers = !isPlayerMode && currentRound && disabled
    ? Object.values(gameState.players).filter(player =>
      currentRound.chosenOptions[player.id] === correctAnswer
    )
    : [];

  // Get selected option (player mode only)
  const selectedOption = isPlayerMode && currentRound && connectionId
    ? currentRound.chosenOptions[connectionId]
    : null;

  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode) return;
    serverAction("selectOption", option, connectionId);
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

  // Calculate the width needed for the longest option
  const maxWidth = Math.max(...options.map(option => option.length * 8 + 48)); // rough calculation

  return (
    <div className={`flex flex-col items-center gap-3 ${isPlayerMode ? "" : "gap-4"}`}>
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
          style={{ width: `${maxWidth}px` }}
        >
          <Button
            onClick={
              isInteractive ? () => handleOptionSelect(option) : undefined
            }
            variant={selectedOption === option ? "default" : "outline"}
            className={`w-full text-lg px-6 py-3 h-auto transition-colors duration-300 whitespace-nowrap ${isInteractive ? "" : "cursor-default pointer-events-none"
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
