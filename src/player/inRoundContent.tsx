import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { CategoryDisplay } from "../components/CategoryDisplay";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { OptionsDisplay } from "../components/OptionsDisplay";
import { BuzzerButton } from "../components/BuzzerButton";
import { AnswerInput } from "../components/AnswerInput";
import { EvaluationDisplay } from "../components/EvaluationDisplay";
import { RevealAnswerAlone } from "../components/RevealAnswerAlone";
import { PointsBreakdown } from "../components/PointsBreakdown";

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
      <AnimatePresence mode="wait">
        {!['transitioningNextRound', 'givingPoints', 'givingPointsAfterBuzz'].includes(gameState.phase) && (<motion.div
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
          <CategoryDisplay isPlayerMode={true} />
        </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!['preQuestioning', 'transitioningNextRound', 'givingPoints', 'givingPointsAfterBuzz'].includes(gameState.phase) && (
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
            <QuestionDisplay isPlayerMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {['showingOptions', 'revealingAnswer'].includes(gameState.phase) && (
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
            <OptionsDisplay isPlayerMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buzzer button - shown during questioning and afterQuestioning for players */}
      <AnimatePresence mode="wait">
        {['questioning', 'afterQuestioning'].includes(gameState.phase) && (
          <motion.div
            key="buzzer"
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
            <BuzzerButton isPlayerMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer input - shown during buzzing phase for the player who buzzed */}
      <AnimatePresence mode="wait">
        {gameState.phase === 'buzzing' && (
          <motion.div
            key="answer-input"
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
            <AnswerInput isPlayerMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation display - shown during buzz-related phases */}
      <AnimatePresence mode="wait">
        {['evaluatingAnswer', 'afterBuzzEvaluation', 'revealAnswerAlone'].includes(gameState.phase) && (
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
            <EvaluationDisplay isPlayerMode={true} />
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
            <RevealAnswerAlone isPlayerMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points breakdown overlay */}
      <AnimatePresence>
        {['givingPoints', 'givingPointsAfterBuzz'].includes(gameState.phase) && (
          <PointsBreakdown isPlayerMode={true} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

