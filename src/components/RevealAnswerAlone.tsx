import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface RevealAnswerAloneProps {
  isPlayerMode?: boolean;
}

export function RevealAnswerAlone({ isPlayerMode = false }: RevealAnswerAloneProps) {
  const { gameState } = useGameStore();

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  
  // Only show during revealAnswerAlone and finishingAfterAnswerAlone phases
  if (gameState.phase !== 'revealAnswerAlone' && gameState.phase !== 'finishingAfterAnswerAlone') return null;
  if (!currentRound) return null;

  const currentQuestion = gameState.questions.find(q => q.id === currentRound.questionId);
  if (!currentQuestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-3xl space-y-8 text-center ${isPlayerMode ? "" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-warm-cream/80 ${isPlayerMode ? "text-lg" : "text-2xl"}`}
      >
        The correct answer is:
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
        className={`font-bold text-white bg-correct-green border-4 border-correct-green/50 rounded-2xl p-8 shadow-2xl ${
          isPlayerMode ? "text-2xl" : "text-6xl"
        }`}
      >
        {currentQuestion.answer}
      </motion.div>
    </motion.div>
  );
}

