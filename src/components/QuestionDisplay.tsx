import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Text } from "./ui/text";
import { Phase } from "../types";
import { useGameStore } from "../store";

interface QuestionDisplayProps {
  isPlayerMode?: boolean;
}

export function QuestionDisplay({ isPlayerMode = false }: QuestionDisplayProps) {
  const { gameState } = useGameStore();
  const [revealedWords, setRevealedWords] = useState<string[]>([]);
  const phase = gameState.phase;

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const question = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  // Handle server messages for word reveal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "wordReveal") {
          setRevealedWords((prev) => [...prev, message.data.word]);
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
  }, [gameState.currentRound]);

  if (!question) return null;
  const categoryDisplay = (
    <div className={`text-gray-600 font-medium mb-3 text-center ${
      isPlayerMode ? "text-lg" : "text-2xl"
    }`}>
      {question.category.toUpperCase()}
    </div>
  );

    if (phase === Phase.QUESTIONING) {
    const allWords = question.text.split(' ');
    
    return (
      <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {categoryDisplay}
        </motion.div>
        <div className={`font-bold text-center leading-tight ${
          isPlayerMode ? "text-2xl" : "text-6xl"
        }`}>
          <div className="inline-block">
            {allWords.map((word, index) => {
              const isRevealed = index < revealedWords.length;
              
              return (
                <motion.span 
                  key={`word-${index}`}
                  className="inline-block mr-2"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={isRevealed ? { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1 
                  } : { 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8 
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                    delay: isRevealed ? index * 0.1 : 0
                  }}
                >
                  {word}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {categoryDisplay}
      </motion.div>
      <motion.div 
        className={`font-bold text-center leading-tight ${
          isPlayerMode ? "text-2xl" : "text-6xl"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        {question.text}
      </motion.div>
    </div>
  );
}
