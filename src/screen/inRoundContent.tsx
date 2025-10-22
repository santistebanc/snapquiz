import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { CategoryDisplay } from "../components/CategoryDisplay";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { OptionsDisplay } from "../components/OptionsDisplay";
import { EvaluationDisplay } from "../components/EvaluationDisplay";
import { RevealAnswerAlone } from "../components/RevealAnswerAlone";

export function InRoundContent() {
  const { gameState } = useGameStore();

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

  return (
    <motion.div
      key={gameState.currentRound}
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      layout
      transition={{
        layout: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }}
    >
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        layout
        transition={{
          duration: 0.5,
          ease: "easeOut",
          layout: {
            duration: 0.5,
            ease: "easeInOut"
          }
        }}
      >
        <CategoryDisplay isPlayerMode={false} />
      </motion.div>

      <AnimatePresence mode="wait">
        {!['preQuestioning', 'transitioningNextRound'].includes(gameState.phase) && (
          <motion.div
            key="question"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{
              duration: 0.5,
              ease: "easeOut",
              layout: {
                duration: 0.5,
                ease: "easeInOut"
              }
            }}
          >
            <QuestionDisplay isPlayerMode={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {['showingOptions', 'revealingAnswer', 'givingPoints', 'finishingRound'].includes(gameState.phase) && (
          <motion.div
            key="options"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{
              duration: 0.5,
              ease: "easeOut",
              layout: {
                duration: 0.5,
                ease: "easeInOut"
              }
            }}
          >
            <OptionsDisplay isPlayerMode={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation display - shown during buzz-related phases */}
      <AnimatePresence mode="wait">
        {['evaluatingAnswer', 'afterBuzzEvaluation', 'revealAnswerAlone', 'givingPointsAfterBuzz', 'finishingRoundAfterBuzz', 'finishingAfterAnswerAlone'].includes(gameState.phase) && (
          <motion.div
            key="evaluation"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{
              duration: 0.3,
              ease: "easeOut",
              layout: {
                duration: 0.3,
                ease: "easeInOut"
              }
            }}
          >
            <EvaluationDisplay isPlayerMode={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal answer alone - shown when all players are banned */}
      <AnimatePresence mode="wait">
        {['revealAnswerAlone', 'finishingAfterAnswerAlone'].includes(gameState.phase) && (
          <motion.div
            key="reveal-answer"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{
              duration: 0.5,
              ease: "easeOut",
              layout: {
                duration: 0.5,
                ease: "easeInOut"
              }
            }}
          >
            <RevealAnswerAlone isPlayerMode={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

