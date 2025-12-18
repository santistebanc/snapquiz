import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store";
import { CategoryDisplay } from "../components/CategoryDisplay";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { OptionsDisplay } from "../components/OptionsDisplay";
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
          <CategoryDisplay isPlayerMode={false} />
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
            <QuestionDisplay isPlayerMode={false} />
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
            <OptionsDisplay isPlayerMode={false} />
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
            <EvaluationDisplay isPlayerMode={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal answer alone - shown when all players are banned OR when correct answer is given but doesn't match exactly */}
      <AnimatePresence mode="wait">
        {(() => {
          // Safely access current round
          if (!gameState.rounds || gameState.currentRound < 1 || gameState.currentRound > gameState.rounds.length) {
            return null;
          }
          const currentRound = gameState.rounds[gameState.currentRound - 1];
          if (!currentRound) return null;
          
          const shouldShowRevealAnswer = ['revealAnswerAlone', 'finishingAfterAnswerAlone'].includes(gameState.phase);
          
          // Also show if answer is correct but doesn't match exactly
          const isAfterBuzzEval = gameState.phase === 'afterBuzzEvaluation';
          const isCorrect = currentRound?.evaluationResult === 'correct';
          const buzzedPlayerId = currentRound?.buzzedPlayerId ?? null;
          const submittedAnswer = buzzedPlayerId && currentRound?.playerAnswers ? currentRound.playerAnswers[buzzedPlayerId] : null;
          const currentQuestion = gameState.questions.find(q => q.id === currentRound?.questionId);
          
          // Safely compare answers with proper null checks
          const isExactMatch = submittedAnswer && currentQuestion?.answer
            ? submittedAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
            : false;
          
          const shouldShowForInexactMatch = isAfterBuzzEval && isCorrect && !isExactMatch && submittedAnswer;
          
          // Debug logging
          if (isAfterBuzzEval && isCorrect) {
            console.log('RevealAnswer Debug:', {
              phase: gameState.phase,
              isCorrect,
              submittedAnswer,
              correctAnswer: currentQuestion?.answer,
              isExactMatch,
              shouldShowForInexactMatch
            });
          }
          
          return (shouldShowRevealAnswer || shouldShowForInexactMatch) && (
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
          );
        })()}
      </AnimatePresence>

      {/* Points breakdown overlay */}
      {['givingPoints', 'givingPointsAfterBuzz'].includes(gameState.phase) && (
        <PointsBreakdown isPlayerMode={false} />
      )}
    </motion.div>
  );
}

