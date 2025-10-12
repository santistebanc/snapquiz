import React, { useState, useEffect } from "react";
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
  const { gameState, sendMessage, connectionId } = useGameStore();
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(3000);

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const currentQuestion = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  // Get player's selected option from server state (only for player mode)
  const playerSelectedOption =
    isPlayerMode && currentRound && connectionId
      ? currentRound.chosenOptions instanceof Map
        ? currentRound.chosenOptions.get(connectionId)
        : currentRound.chosenOptions[connectionId]
      : null;

  // Handle server messages for word reveal and timer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "wordReveal") {
          setRevealedWords((prev) => [...prev, message.data.word]);
        } else if (message.type === "timerCountdown") {
          setTimeRemaining(message.data.timeRemaining);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    // Listen for messages from the game store's socket
    const socket = (useGameStore.getState() as any).socket;
    if (socket) {
      socket.addEventListener("message", handleMessage);
      return () => socket.removeEventListener("message", handleMessage);
    }
  }, []);

  // Reset revealed words when round changes
  useEffect(() => {
    setRevealedWords([]);
    setTimeRemaining(3000);
  }, [gameState.currentRound]);

  // Handle option selection (only for player mode)
  const handleOptionSelect = (option: string) => {
    if (!isPlayerMode) return;
    
    console.log("Player selecting option:", option);
    console.log(
      "Sending selectOption message with connectionId:",
      connectionId
    );
    sendMessage({
      type: "selectOption",
      data: {
        option: option,
        connectionId: connectionId,
      },
    });
  };
  if (!currentQuestion) return null;

  const questionProps = {
    question: currentQuestion,
    revealedWords,
    phase: gameState.phase,
    isPlayerMode,
  };

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
            <QuestionDisplay {...questionProps} />
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
            <TimerBar timeRemaining={timeRemaining} isPlayerMode={isPlayerMode} />
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
              options={currentQuestion.options}
              correctAnswer={currentQuestion.answer}
              selectedOption={isPlayerMode ? (playerSelectedOption || undefined) : undefined}
              onOptionSelect={isPlayerMode ? handleOptionSelect : undefined}
              isPlayerMode={isPlayerMode}
              disabled={gameState.phase === Phase.REVEALING_ANSWER}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
