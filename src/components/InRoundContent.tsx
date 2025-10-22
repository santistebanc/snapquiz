import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { CategoryDisplay } from "./CategoryDisplay";
import { QuestionDisplay } from "./QuestionDisplay";
import { OptionsDisplay } from "./OptionsDisplay";
import { BuzzerButton } from "./BuzzerButton";
import { AnswerInput } from "./AnswerInput";
import { EvaluationDisplay } from "./EvaluationDisplay";
import { RevealAnswerAlone } from "./RevealAnswerAlone";

interface InRoundContentProps {
  isPlayerMode: boolean;
}

export function InRoundContent({ isPlayerMode }: InRoundContentProps) {
  const { gameState, connectionId } = useGameStore();

  // Check if this player has already buzzed and answered incorrectly
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  const playerHasBuzzedAndAnswered = isPlayerMode && 
    currentRound?.playerAnswers[connectionId] && 
    currentRound?.buzzedPlayerId !== connectionId && // Not the current buzzer
    ['questioning', 'afterQuestioning', 'showingOptions', 'buzzing', 'evaluatingAnswer', 'afterBuzzEvaluation'].includes(gameState.phase);

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

  // If player has already buzzed and answered, show category, question, and evaluation display
  if (playerHasBuzzedAndAnswered) {
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
          <CategoryDisplay isPlayerMode={isPlayerMode} />
        </motion.div>

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
          <QuestionDisplay isPlayerMode={isPlayerMode} />
        </motion.div>

        <motion.div
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
          <EvaluationDisplay isPlayerMode={isPlayerMode} />
        </motion.div>
      </motion.div>
    );
  }

  // Use unified layout for both screen and player modes
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
        <CategoryDisplay isPlayerMode={isPlayerMode} />
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
            <QuestionDisplay isPlayerMode={isPlayerMode} />
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
            <OptionsDisplay
              isPlayerMode={isPlayerMode}
            />
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
            <BuzzerButton isPlayerMode={isPlayerMode} />
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
            <AnswerInput isPlayerMode={isPlayerMode} />
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
            <EvaluationDisplay isPlayerMode={isPlayerMode} />
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
            <RevealAnswerAlone isPlayerMode={isPlayerMode} />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
