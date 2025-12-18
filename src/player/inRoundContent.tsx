import React from "react";
import { createPortal } from "react-dom";
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
  const { gameState, connectionId } = useGameStore();
  
  // Check if current player is banned (answered incorrectly)
  const currentRound = gameState.rounds && gameState.currentRound > 0 && gameState.currentRound <= gameState.rounds.length
    ? gameState.rounds[gameState.currentRound - 1]
    : null;
  const isPlayerBanned = currentRound && connectionId && (currentRound.pointsAwarded[connectionId] || 0) < 0;

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

  // Phases where the overlay message SHOULD be shown
  const allowedPhases = [
    'preQuestioning',
    'questioning',
    'afterQuestioning',
    'showingOptions',
    'revealingAnswer'
  ];
  const shouldShowOverlay = isPlayerBanned && allowedPhases.includes(gameState.phase);

  return (
    <>
      {/* Overlay message for banned players - rendered via portal to ensure fixed positioning relative to viewport */}
      {shouldShowOverlay && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            pointerEvents: 'none'
          }}
        >
          <div 
            className="bg-red-900/90 border-2 border-red-500 rounded-lg px-6 py-4 shadow-2xl"
            style={{
              maxWidth: '42rem',
              width: '100%'
            }}
          >
            <p className="text-red-200 text-xl font-bold text-center">
              You answered incorrectly. Only other players can answer now.
            </p>
          </div>
        </motion.div>,
        document.body
      )}
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
          
          // Debug logging (only in player mode to reduce noise)
          if (isAfterBuzzEval && isCorrect) {
            console.log('RevealAnswer Debug (Player):', {
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
              <RevealAnswerAlone isPlayerMode={true} />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Points breakdown overlay */}
      {['givingPoints', 'givingPointsAfterBuzz'].includes(gameState.phase) && (
        <PointsBreakdown isPlayerMode={true} />
      )}
    </motion.div>
    </>
  );
}

