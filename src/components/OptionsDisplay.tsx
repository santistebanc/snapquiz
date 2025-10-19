import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useGameStore } from "../store";

interface OptionsDisplayProps {
  isPlayerMode?: boolean;
}

export function OptionsDisplay({ isPlayerMode = false }: OptionsDisplayProps) {
  const { serverState, serverAction, connectionId } = useGameStore();

  const currentRound = serverState.rounds[serverState.currentRound - 1]
  const currentQuestion = currentRound ? serverState.questions.find(q => q.id === currentRound.questionId) : null;

  if (!currentQuestion || !currentRound) return null;

  const { answer: correctAnswer } = currentQuestion;
  const options = currentRound.shuffledOptions;
  const disabled = ['revealingAnswer', 'givingPoints', 'finishingRound', 'transitioningNextRound'].includes(serverState.phase);
  const isInteractive = isPlayerMode;

  // Get correct players (screen mode only)
  const correctPlayers = !isPlayerMode && currentRound && disabled
    ? Object.values(serverState.players).filter(player =>
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
          ? "bg-selected-blue text-white border-selected-blue" 
          : "bg-correct-green text-white border-correct-green";
      } else if (selectedOption === option) {
        return "bg-wrong-red text-white border-wrong-red";
      } else {
        return "bg-card-dark/60 text-warm-cream border-border-muted/30";
      }
    } else {
      // Selection mode
      if (selectedOption === option) {
        return "bg-selected-blue text-white border-selected-blue hover:bg-selected-blue hover:border-selected-blue";
      } else {
        return "bg-card-dark/60 text-warm-cream border-border-muted/30 hover:bg-card-dark/80";
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
                ? { backgroundColor: 'hsl(var(--wrong-red))', borderColor: 'hsl(var(--wrong-red))', color: 'white' }
                : selectedOption === option && !disabled
                ? { backgroundColor: 'hsl(var(--selected-blue))', borderColor: 'hsl(var(--selected-blue))', color: 'white' }
                : disabled && option === correctAnswer && selectedOption === option
                ? { backgroundColor: 'hsl(var(--selected-blue))', borderColor: 'hsl(var(--selected-blue))', color: 'white' }
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
