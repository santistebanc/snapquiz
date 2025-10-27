import { useEffect, useRef } from "react";
import { useGameStore } from "../store";
import { useAudio } from "../contexts/AudioContext";

interface AudioPreloaderProps {
  isPlayerMode?: boolean;
}

export function AudioPreloader({ isPlayerMode = false }: AudioPreloaderProps) {
  const { gameState } = useGameStore();
  const { preloadAudio } = useAudio();
  const lastPreloadedQuestionId = useRef<string | null>(null);

  useEffect(() => {
    // Skip in player mode - only preload on screen
    if (isPlayerMode) {
      return;
    }

    let questionToPreload: string | null = null;

    // Case 1: In lobby - preload the first question
    if (gameState.phase === 'lobby' && gameState.questions.length > 0) {
      const firstQuestion = gameState.questions[0];
      
      if (firstQuestion?.audioUrl) {
        questionToPreload = firstQuestion.id;
        console.log('📚 Lobby: Preloading first question audio');
      }
    }

    // Case 2: During a round - preload the NEXT round's question
    if (
      gameState.currentRound > 0 && 
      gameState.currentRound < gameState.rounds.length &&
      (gameState.phase === 'givingPoints' || 
       gameState.phase === 'givingPointsAfterBuzz' ||
       gameState.phase === 'finishingRound' ||
       gameState.phase === 'finishingRoundAfterBuzz')
    ) {
      const nextRoundIndex = gameState.currentRound; // currentRound is 1-based, so this is the next round
      const nextRound = gameState.rounds[nextRoundIndex];
      const nextQuestion = nextRound ? gameState.questions.find(q => q.id === nextRound.questionId) : null;
      
      if (nextQuestion?.audioUrl) {
        questionToPreload = nextQuestion.id;
        console.log(`📚 Round ${gameState.currentRound}: Preloading next round's audio (Round ${nextRoundIndex + 1})`);
      }
    }

    // Preload if we have a question and haven't preloaded it yet
    if (questionToPreload && lastPreloadedQuestionId.current !== questionToPreload) {
      preloadAudio(questionToPreload);
      lastPreloadedQuestionId.current = questionToPreload;
    }
  }, [
    isPlayerMode,
    gameState.phase,
    gameState.currentRound,
    gameState.rounds,
    gameState.questions,
    preloadAudio
  ]);

  // This component doesn't render anything
  return null;
}

