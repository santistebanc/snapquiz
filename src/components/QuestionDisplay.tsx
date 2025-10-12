import React from "react";
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
    return (
      <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
        {categoryDisplay}
        <div className={`font-bold text-center leading-tight ${
          isPlayerMode ? "text-2xl" : "text-6xl"
        }`}>
          {revealedWords.map((word, index) => (
            <span key={index} className="inline-block mr-2">
              {word}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${isPlayerMode ? "" : "space-y-4"}`}>
      {categoryDisplay}
      <div className={`font-bold text-center leading-tight ${
        isPlayerMode ? "text-2xl" : "text-6xl"
      }`}>
        {question.text}
      </div>
    </div>
  );
}
