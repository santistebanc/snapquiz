import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { useAudio } from "../contexts/AudioContext";

interface QuestionDisplayProps {
  isPlayerMode?: boolean;
}

export function QuestionDisplay({ isPlayerMode = false }: QuestionDisplayProps) {
  const { gameState } = useGameStore();
  const { playAudio, stopAllAudio } = useAudio();
  const lastPlayedQuestionId = useRef<string | null>(null);

  // Get current round and question
  const currentRound =
    gameState.rounds && gameState.rounds.length > 0
      ? gameState.rounds[gameState.currentRound - 1]
      : null;
  const question = currentRound
    ? gameState.questions.find((q) => q.id === currentRound.questionId)
    : null;

  // Play audio when questioning phase starts - ONLY in screen mode
  useEffect(() => {
    console.log('QuestionDisplay useEffect:', {
      isPlayerMode,
      phase: gameState.phase,
      questionId: question?.id,
      hasAudioUrl: !!question?.audioUrl,
      lastPlayed: lastPlayedQuestionId.current
    });
    
    // Skip audio entirely in player mode
    if (isPlayerMode) {
      return;
    }
    
    const isQuestioningPhase = gameState.phase === 'questioning' || gameState.phase === 'afterQuestioning';
    
    if (gameState.phase === 'questioning' && question?.id && question?.audioUrl) {
      // Only play if it's a different question or if we just entered the questioning phase
      if (lastPlayedQuestionId.current !== question.id) {
        console.log('🎵 Starting audio playback for question (screen mode):', question.id);
        playAudio(question.id);
        lastPlayedQuestionId.current = question.id;
      }
    } else if (!isQuestioningPhase) {
      // Only stop audio when leaving both questioning AND afterQuestioning phases
      if (lastPlayedQuestionId.current) {
        console.log('⏹️ Stopping audio (left questioning phases)');
        stopAllAudio();
        lastPlayedQuestionId.current = null;
      }
    }
  }, [isPlayerMode, gameState.phase, gameState.currentRound, question?.id, question?.audioUrl, playAudio, stopAllAudio]);

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
