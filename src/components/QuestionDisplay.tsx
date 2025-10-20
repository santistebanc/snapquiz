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

  const allWords = question.text.split(' ');

  return (
    <div className={`font-bold text-center leading-tight text-white drop-shadow-lg ${isPlayerMode ? "text-2xl" : "text-6xl"
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
                duration: 0.5,
                ease: "easeOut"
              }}
            >
              {word}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
