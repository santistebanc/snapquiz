import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { CategoryDisplay } from "./CategoryDisplay";
import { QuestionDisplay } from "./QuestionDisplay";
import { OptionsDisplay } from "./OptionsDisplay";

interface InRoundContentProps {
  isPlayerMode: boolean;
}

export function InRoundContent({ isPlayerMode }: InRoundContentProps) {
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

  // Use unified layout for both screen and player modes
  return (
    <motion.div
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
        {!['preQuestioning', 'questioning', 'afterQuestioning', 'transitioningNextRound'].includes(gameState.phase) && (
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

    </motion.div>
  );
}
