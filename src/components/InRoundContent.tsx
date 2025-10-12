import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { QuestionDisplay } from "./QuestionDisplay";
import { TimerBar } from "./TimerBar";
import { OptionsDisplay } from "./OptionsDisplay";
import { Phase } from "../types";

interface InRoundContentProps {
  isPlayerMode: boolean;
}

export function InRoundContent({ isPlayerMode }: InRoundContentProps) {
  const { gameState } = useGameStore();

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const currentQuestion = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  if (!currentQuestion) return null;


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95
    }
  };

  // Use unified layout for both screen and player modes
  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {gameState.phase >= Phase.QUESTIONING && (
          <motion.div
            key="question"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <QuestionDisplay isPlayerMode={isPlayerMode} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState.phase === Phase.WAIT_AFTER_QUESTION && (
          <motion.div
            key="timer"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <TimerBar isPlayerMode={isPlayerMode} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState.phase >= Phase.SHOWING_OPTIONS && (
          <motion.div
            key="options"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <OptionsDisplay
              isPlayerMode={isPlayerMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
