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
        // Keep the selected color if this was the selected option, otherwise show as correct
        return selectedOption === option 
          ? "bg-[#54A7B0] text-white border-[#54A7B0]" 
          : "bg-[#5a7a5c] text-white border-[#5a7a5c]";
      } else if (selectedOption === option) {
        return "bg-[#a05552] text-white border-[#a05552]";
      } else {
        return "bg-[#2d3a3b]/60 text-[#feecba] border-[#6f817e]/30";
      }
    } else {
      // Selection mode
      if (selectedOption === option) {
        return "bg-[#54A7B0] text-white border-[#54A7B0] hover:bg-[#54A7B0] hover:border-[#54A7B0]";
      } else {
        return "bg-[#2d3a3b]/60 text-[#feecba] border-[#6f817e]/30 hover:bg-[#2d3a3b]/80";
      }
    }
  };

  // Calculate the width needed for the longest option with minimum width constraint
  const minWidth = 250; // minimum width in pixels
  const maxWidth = Math.max(minWidth, ...options.map(option => option.length * 8 + 48)); // rough calculation

  return (
    <div className={`flex flex-col items-center gap-3 ${isPlayerMode ? "" : "gap-4"}`}>
      {options.map((option, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: disabled && option === correctAnswer ? 1.15 : 1
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: index * 0.1,
          }}
          whileHover={
            isInteractive 
              ? { scale: 1.02 } 
              : disabled && option === correctAnswer 
                ? { scale: 1.15 } 
                : disabled && selectedOption === option && option === correctAnswer
                  ? { scale: 1.15 }
                  : {}
          }
          whileTap={isInteractive ? { scale: 0.98 } : {}}
          className="relative"
          style={{ width: `${maxWidth}px` }}
        >
          <Button
            onClick={
              isInteractive ? () => handleOptionSelect(option) : undefined
            }
            variant="outline"
            className={`w-full text-lg px-6 py-3 h-auto transition-colors duration-300 whitespace-nowrap ${isInteractive ? "" : "cursor-default pointer-events-none"
              } ${getOptionStyle(option)}`}
            style={{
              opacity: 1,
              ...(disabled && selectedOption === option && option !== correctAnswer
                ? { backgroundColor: '#a05552', borderColor: '#a05552', color: 'white' }
                : selectedOption === option && !disabled
                ? { backgroundColor: '#54A7B0', borderColor: '#54A7B0', color: 'white' }
                : disabled && option === correctAnswer && selectedOption === option
                ? { backgroundColor: '#54A7B0', borderColor: '#54A7B0', color: 'white' }
                : {})
            }}
            disabled={isInteractive ? disabled : false}
          >
            {option}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
