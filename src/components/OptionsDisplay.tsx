import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useGameStore } from "../store";
import { generateAvatarUrl } from "../utils";

interface OptionsDisplayProps {
  isPlayerMode?: boolean;
}

export function OptionsDisplay({ isPlayerMode = false }: OptionsDisplayProps) {
  const { gameState, serverAction, connectionId } = useGameStore();

  // Safely access current round
  if (!gameState.rounds || gameState.currentRound < 1 || gameState.currentRound > gameState.rounds.length) {
    return null;
  }
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound) return null;
  
  const currentQuestion = gameState.questions.find(q => q.id === currentRound.questionId);
  if (!currentQuestion) return null;

  const { answer: correctAnswer } = currentQuestion;
  const options = currentRound.shuffledOptions;
  const disabled = ['revealingAnswer', 'givingPoints', 'finishingRound', 'transitioningNextRound'].includes(gameState.phase);
  const isInteractive = isPlayerMode;

  // Check if current player is banned (already has points deducted from buzzing)
  const isPlayerBanned = isPlayerMode && connectionId && (currentRound.pointsAwarded[connectionId] || 0) < 0;

  // Get correct players (screen mode only)
  const correctPlayers = !isPlayerMode && currentRound && disabled
    ? Object.values(gameState.players).filter(player =>
      currentRound.playerAnswers[player.id] === correctAnswer
    )
    : [];

  // Get selected option (player mode only)
  const selectedOption = isPlayerMode && currentRound && connectionId
    ? currentRound.playerAnswers[connectionId]
    : null;

  // Get players who selected each option (revealingAnswer phase only)
  const getPlayersForOption = (option: string) => {
    if (!disabled || gameState.phase !== 'revealingAnswer') return [];
    return Object.values(gameState.players).filter(player =>
      currentRound.playerAnswers[player.id] === option
    );
  };

  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode || isPlayerBanned) return;
    serverAction("selectOption", option, connectionId);
  };

  // Sound effects temporarily removed for debugging

  const getOptionStyle = (option: string) => {
    if (disabled) {
      // Answer reveal mode
      if (option === correctAnswer) {
        // If selected and correct, use gold/yellow color; otherwise show as correct green
        return selectedOption === option 
          ? "bg-warm-yellow text-white border-warm-yellow" 
          : "bg-correct-green text-white border-correct-green";
      } else if (selectedOption === option) {
        return "bg-wrong-red text-white border-wrong-red";
      } else {
        return "bg-card-dark/60 text-warm-cream border-border-muted/30";
      }
    } else {
      // Selection mode
      if (selectedOption === option) {
        return "bg-selected-blue text-white border-selected-blue";
      } else {
        return "bg-card-dark/60 text-warm-cream border-border-muted/30";
      }
    }
  };

  // Calculate the width needed for the longest option with minimum width constraint
  return (
    <div className={`flex flex-col items-center gap-3 w-full max-w-4xl mx-auto px-4 ${isPlayerMode ? "" : "gap-4"}`}>
      {options.map((option, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: disabled && option === correctAnswer ? 1.15 : selectedOption === option ? 1.05 : 1
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: index * 0.1,
          }}
          whileTap={isInteractive ? { scale: 0.98 } : {}}
          className="relative w-full"
        >
          <Button
            onClick={
              isInteractive ? () => handleOptionSelect(option) : undefined
            }
            variant="outline"
            className={`w-full text-lg px-6 py-3 h-auto transition-colors duration-300 break-words whitespace-normal text-center leading-relaxed ${isInteractive ? "" : "cursor-default pointer-events-none"
              } ${getOptionStyle(option)} ${isPlayerBanned && !disabled && selectedOption !== option ? "opacity-50 grayscale" : ""}`}
            style={{
              opacity: isPlayerBanned && !disabled && selectedOption !== option ? 0.5 : 1,
              ...(disabled && selectedOption === option && option !== correctAnswer
                ? { backgroundColor: 'hsl(var(--wrong-red))', borderColor: 'hsl(var(--wrong-red))', color: 'white' }
                : selectedOption === option && !disabled
                ? { backgroundColor: 'hsl(var(--selected-blue))', borderColor: 'hsl(var(--selected-blue))', color: 'white' }
                : disabled && option === correctAnswer && selectedOption === option
                ? { backgroundColor: 'hsl(var(--warm-yellow))', borderColor: 'hsl(var(--warm-yellow))', color: 'white' }
                : {})
            }}
            disabled={isInteractive ? (disabled || !!isPlayerBanned) : false}
          >
            {option}
          </Button>
          
          {/* Show player avatars overlaid on options during revealingAnswer phase */}
          {gameState.phase === 'revealingAnswer' && (
            <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
              {getPlayersForOption(option).map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (getPlayersForOption(option).indexOf(player) * 0.1) }}
                >
                  <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                    <AvatarImage
                      src={generateAvatarUrl(player.avatar || 'robot-1')}
                      alt={player.name}
                    />
                  </Avatar>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
