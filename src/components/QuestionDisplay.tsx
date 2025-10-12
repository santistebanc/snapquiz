import React from "react";
import { motion } from "framer-motion";
import { Text } from "./ui/text";
import { Phase } from "../types";

interface QuestionDisplayProps {
  question: {
    text: string;
    category: string;
  };
  revealedWords: string[];
  phase: Phase;
  isPlayerMode?: boolean;
}

export function QuestionDisplay({ 
  question, 
  revealedWords, 
  phase, 
  isPlayerMode = false 
}: QuestionDisplayProps) {
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
