import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface CategoryDisplayProps {
  isPlayerMode?: boolean;
}

export function CategoryDisplay({ isPlayerMode = false }: CategoryDisplayProps) {
  const { gameState } = useGameStore();

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const question = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  if (!question) return null;

  return (
    <motion.div
      className={`text-gray-600 font-medium mb-3 text-center ${
        isPlayerMode ? "text-lg" : "text-2xl"
      }`}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ 
        opacity: gameState.phase === 'transitioningNextRound' ? 0 : 1, 
        y: 0, 
        scale: 1 
      }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        duration: gameState.phase === 'transitioningNextRound' ? 0.5 : 0.6, 
        ease: "easeOut",
        type: gameState.phase === 'transitioningNextRound' ? "tween" : "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      {question.category.toUpperCase()}
    </motion.div>
  );
}
