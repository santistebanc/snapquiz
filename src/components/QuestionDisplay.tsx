import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";

interface QuestionDisplayProps {
  isPlayerMode?: boolean;
}

export function QuestionDisplay({ isPlayerMode = false }: QuestionDisplayProps) {
  const { gameState } = useGameStore();

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const question = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  // Derive revealed words from current round's revealedWordsIndex
  const revealedWords = question && currentRound
    ? question.text.split(' ').slice(0, currentRound.revealedWordsIndex)
    : [];

  if (!question) return null;
  const categoryDisplay = (
    <div className={`text-gray-600 font-medium mb-3 text-center ${
      isPlayerMode ? "text-lg" : "text-2xl"
    }`}>
      {question.category.toUpperCase()}
    </div>
  );

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
