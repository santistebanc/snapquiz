import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { useEffect, useRef } from "react";
import { Howl } from "howler";

interface RevealAnswerAloneProps {
  isPlayerMode?: boolean;
}

export function RevealAnswerAlone({ isPlayerMode = false }: RevealAnswerAloneProps) {
  const { gameState } = useGameStore();
  const hasPlayedSound = useRef(false);

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  
  // Show during revealAnswerAlone, finishingAfterAnswerAlone, or afterBuzzEvaluation (for inexact correct answers)
  const validPhases = ['revealAnswerAlone', 'finishingAfterAnswerAlone', 'afterBuzzEvaluation'];
  if (!validPhases.includes(gameState.phase)) return null;
  if (!currentRound) return null;

  const currentQuestion = gameState.questions.find(q => q.id === currentRound.questionId);
  if (!currentQuestion) return null;

  // Play reveal sound when answer is shown (only in screen mode)
  useEffect(() => {
    if (!isPlayerMode && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      
      const revealSound = new Howl({
        src: ['/sounds/reveal.mp3'],
        volume: 0.6,
        onloaderror: () => {
          console.log('Reveal sound file not found, using fallback');
          // Fallback to Web Audio API if sound file doesn't exist
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
        }
      });
      revealSound.play();
    }
    
    // Reset sound flag when phase changes away from reveal phases
    if (!validPhases.includes(gameState.phase)) {
      hasPlayedSound.current = false;
    }
  }, [isPlayerMode, gameState.phase, validPhases]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-3xl mx-auto text-center ${isPlayerMode ? "" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
        className={`font-bold text-white bg-correct-green border-4 border-correct-green/50 rounded-2xl p-6 shadow-2xl ${
          isPlayerMode ? "text-xl" : "text-4xl"
        }`}
      >
        {currentQuestion.answer}
      </motion.div>
    </motion.div>
  );
}

