import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface RevealAnswerAloneProps {
  isPlayerMode?: boolean;
}

export function RevealAnswerAlone({ isPlayerMode = false }: RevealAnswerAloneProps) {
  const { gameState } = useGameStore();

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  
  // Show during revealAnswerAlone, finishingAfterAnswerAlone, or afterBuzzEvaluation (for inexact correct answers)
  const validPhases = ['revealAnswerAlone', 'finishingAfterAnswerAlone', 'afterBuzzEvaluation'];
  if (!validPhases.includes(gameState.phase)) return null;
  if (!currentRound) return null;

  const currentQuestion = gameState.questions.find(q => q.id === currentRound.questionId);
  if (!currentQuestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-3xl mx-auto text-center ${isPlayerMode ? "" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
        className={`font-bold text-white bg-correct-green border-4 border-correct-green/50 rounded-2xl p-6 shadow-2xl ${
          isPlayerMode ? "text-xl" : "text-4xl"
        }`}
      >
        {currentQuestion.answer}
      </motion.div>
    </motion.div>
  );
}

