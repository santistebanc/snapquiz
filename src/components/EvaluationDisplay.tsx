import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Howl } from "howler";

interface EvaluationDisplayProps {
  isPlayerMode?: boolean;
}

export function EvaluationDisplay({ isPlayerMode = false }: EvaluationDisplayProps) {
  const { gameState, connectionId } = useGameStore();
  const hasPlayedSound = useRef(false);

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  
  // Show during buzz-related phases
  const buzzPhases = [
    'evaluatingAnswer',
    'afterBuzzEvaluation',
    'revealAnswerAlone',
    'givingPointsAfterBuzz',
    'finishingRoundAfterBuzz',
    'finishingAfterAnswerAlone'
  ];
  
  // Also show during certain phases if this player has already answered but is not the current buzzer
  const playerHasAnswered = isPlayerMode && currentRound?.playerAnswers[connectionId];
  const isNotCurrentBuzzer = currentRound?.buzzedPlayerId !== connectionId;
  const showInQuestioningPhase = playerHasAnswered && isNotCurrentBuzzer && 
    ['questioning', 'afterQuestioning', 'showingOptions', 'buzzing', 'evaluatingAnswer', 'afterBuzzEvaluation'].includes(gameState.phase);
  
  if (!buzzPhases.includes(gameState.phase) && !showInQuestioningPhase) return null;
  if (!currentRound) return null;

  const { evaluationResult, buzzedPlayerId } = currentRound;
  
  // If player is viewing their own wrong answer during questioning, use their connectionId
  const displayPlayerId = showInQuestioningPhase ? connectionId : buzzedPlayerId;
  const player = displayPlayerId ? gameState.players[displayPlayerId] : null;
  const submittedAnswer = displayPlayerId ? currentRound.playerAnswers[displayPlayerId] : null;
  
  // When showing in questioning phase, the answer was wrong (otherwise they wouldn't be there)
  const displayEvaluationResult = showInQuestioningPhase ? 'wrong' : evaluationResult;
  
  // During evaluatingAnswer: show only answer text (and player name for screen)
  // In all other phases: show the evaluation result (checkmark/X)
  const showEvaluationResult = gameState.phase !== 'evaluatingAnswer';

  // Show player name if:
  // - In screen mode: always show
  // - In player mode: only show if it's NOT the current player's answer
  const showPlayerName = player && (
    !isPlayerMode || (isPlayerMode && displayPlayerId !== connectionId)
  );

  // Play sound effects when evaluation result is shown (only in screen mode)
  useEffect(() => {
    if (!isPlayerMode && showEvaluationResult && displayEvaluationResult && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      
      if (displayEvaluationResult === 'correct') {
        // Play correct sound
        const correctSound = new Howl({
          src: ['/sounds/correct.mp3'],
          volume: 0.5,
          onloaderror: () => {
            console.log('Correct sound file not found, using fallback');
            // Fallback to Web Audio API if sound file doesn't exist
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          }
        });
        correctSound.play();
      } else {
        // Play wrong sound
        const wrongSound = new Howl({
          src: ['/sounds/wrong.mp3'],
          volume: 0.5,
          onloaderror: () => {
            console.log('Wrong sound file not found, using fallback');
            // Fallback to Web Audio API if sound file doesn't exist
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          }
        });
        wrongSound.play();
      }
    }
    
    // Reset sound flag when phase changes
    if (!buzzPhases.includes(gameState.phase)) {
      hasPlayedSound.current = false;
    }
  }, [showEvaluationResult, displayEvaluationResult, gameState.phase, buzzPhases]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-2xl mx-auto space-y-6 text-center ${isPlayerMode ? "text-lg" : "text-2xl"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`bg-card-dark/60 border-2 border-border-muted/30 rounded-lg p-6 ${
          isPlayerMode ? "text-xl" : "text-4xl"
        }`}
      >
        <div className="font-bold text-warm-cream">
          {showPlayerName && (
            <>
              <span className="text-warm-yellow">{player.name}</span>
              <span className="text-warm-cream/80">: </span>
            </>
          )}
          "{submittedAnswer || "(no answer)"}"
        </div>
      </motion.div>

      {showEvaluationResult && displayEvaluationResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          {displayEvaluationResult === 'correct' ? (
            <div className={`flex items-center justify-center rounded-full bg-correct-green text-white ${
              isPlayerMode ? "w-24 h-24" : "w-40 h-40"
            }`}>
              <Check className={isPlayerMode ? "w-16 h-16" : "w-28 h-28"} strokeWidth={3} />
            </div>
          ) : (
            <div className={`flex items-center justify-center rounded-full bg-wrong-red text-white ${
              isPlayerMode ? "w-24 h-24" : "w-40 h-40"
            }`}>
              <X className={isPlayerMode ? "w-16 h-16" : "w-28 h-28"} strokeWidth={3} />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

