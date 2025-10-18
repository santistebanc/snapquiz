import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface CategoryDisplayProps {
  isPlayerMode?: boolean;
}

export function CategoryDisplay({ isPlayerMode = false }: CategoryDisplayProps) {
  const { serverState } = useGameStore();

  // Get current round and question
  const currentRound =
    serverState.rounds && serverState.rounds.length > 0
      ? serverState.rounds[serverState.currentRound - 1]
      : null;
  const question = currentRound
    ? serverState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  if (!question) return null;

  return (
    <motion.div
      className={`text-warm-yellow font-bold mb-3 text-center drop-shadow-lg ${
        isPlayerMode ? "text-lg" : "text-2xl"
      }`}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ 
        opacity: serverState.phase === 'transitioningNextRound' ? 0 : 1, 
        y: 0, 
        scale: 1 
      }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        duration: serverState.phase === 'transitioningNextRound' ? 0.5 : 0.6, 
        ease: "easeOut",
        type: serverState.phase === 'transitioningNextRound' ? "tween" : "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      {question.category.toUpperCase()}
    </motion.div>
  );
}
