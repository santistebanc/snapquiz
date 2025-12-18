import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Check, X } from "lucide-react";

interface EvaluationDisplayProps {
  isPlayerMode?: boolean;
}

export function EvaluationDisplay({ isPlayerMode = false }: EvaluationDisplayProps) {
  const { gameState, connectionId } = useGameStore();

  // Safely access current round
  if (!gameState.rounds || gameState.currentRound < 1 || gameState.currentRound > gameState.rounds.length) {
    return null;
  }
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound) return null;
  
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
  const playerHasAnswered = isPlayerMode && currentRound?.playerAnswers?.[connectionId];
  const isNotCurrentBuzzer = currentRound?.buzzedPlayerId !== connectionId;
  const showInQuestioningPhase = playerHasAnswered && isNotCurrentBuzzer && 
    ['questioning', 'afterQuestioning', 'showingOptions', 'buzzing', 'evaluatingAnswer', 'afterBuzzEvaluation'].includes(gameState.phase);
  
  if (!buzzPhases.includes(gameState.phase) && !showInQuestioningPhase) return null;

  // Safely extract values - they might be null after a wrong answer resets the state
  const evaluationResult = currentRound.evaluationResult ?? null;
  const buzzedPlayerId = currentRound.buzzedPlayerId ?? null;
  
  // If player is viewing their own wrong answer during questioning, use their connectionId
  // Only use buzzedPlayerId if it's not null and we're not in questioning phase
  const displayPlayerId = showInQuestioningPhase ? connectionId : (buzzedPlayerId || null);
  
  // If we don't have a valid displayPlayerId and we're not in questioning phase, don't render
  // This prevents crashes when buzzedPlayerId is null during state transitions
  if (!displayPlayerId && !showInQuestioningPhase) return null;
  
  // Only access player and answer if we have a valid displayPlayerId
  const player = displayPlayerId ? gameState.players?.[displayPlayerId] : null;
  const submittedAnswer = displayPlayerId && currentRound.playerAnswers ? currentRound.playerAnswers[displayPlayerId] : null;
  
  // When showing in questioning phase, the answer was wrong (otherwise they wouldn't be there)
  // Only show evaluation result if we have a valid result or we're in questioning phase
  const displayEvaluationResult = showInQuestioningPhase ? 'wrong' : (evaluationResult || null);
  
  // During evaluatingAnswer: show only answer text (and player name for screen)
  // In all other phases: show the evaluation result (checkmark/X)
  const showEvaluationResult = gameState.phase !== 'evaluatingAnswer';

  // Show player name if:
  // - In screen mode: always show
  // - In player mode: only show if it's NOT the current player's answer
  const showPlayerName = player && (
    !isPlayerMode || (isPlayerMode && displayPlayerId !== connectionId)
  );

  // Sound effects temporarily removed for debugging

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
          {showPlayerName && player && (
            <>
              <span className="text-warm-yellow">{player.name}</span>
              <span className="text-warm-cream/80">: </span>
            </>
          )}
          "{submittedAnswer || "(no answer)"}"
        </div>
      </motion.div>

      {showEvaluationResult && displayEvaluationResult && displayEvaluationResult !== null && (
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

