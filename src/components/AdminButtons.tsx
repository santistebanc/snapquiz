import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Button } from "./ui/button";

export function AdminButtons() {
  const { gameState, serverAction, connectionId } = useGameStore();
  
  // Check if current player is admin
  const currentPlayer = connectionId ? gameState.players[connectionId] : null;
  const isAdmin = currentPlayer?.isAdmin || false;
  
  // Only show buttons for admin players
  if (!isAdmin) return null;

  const handleNextRound = useCallback(() => {
    serverAction("nextRound");
  }, [serverAction]);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Action buttons (left side) */}
      <div className="flex gap-2">
        {(() => {
          // Only show Continue button when there are still unbanned players (will go to questioning, not revealAnswerAlone)
          if (gameState.phase === 'afterBuzzEvaluation') {
            const currentRound = gameState.rounds && gameState.currentRound > 0 && gameState.currentRound <= gameState.rounds.length
              ? gameState.rounds[gameState.currentRound - 1]
              : null;
            
            if (currentRound) {
              const evaluationResult = currentRound.evaluationResult;
              const totalPlayers = Object.keys(gameState.players).length;
              const playersWhoAnswered = Object.keys(currentRound.playerAnswers || {}).length;
              
              // Show button only if wrong answer and not all players have answered (will go to questioning)
              const shouldShow = evaluationResult === 'wrong' && playersWhoAnswered < totalPlayers;
              
              if (shouldShow) {
                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Button onClick={() => serverAction("continueAfterBuzzEvaluation")} size="sm" className="bg-warm-orange hover:bg-warm-orange/90 text-white">
                      Continue
                    </Button>
                  </motion.div>
                );
              }
            }
          }
          return null;
        })()}

        {(gameState.phase === 'revealingAnswer' || gameState.phase === 'revealAnswerAlone') && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Button 
              onClick={() => serverAction(gameState.phase === 'revealingAnswer' ? "goToGivingPoints" : "goToGivingPointsAfterBuzz")} 
              size="sm" 
              className="bg-warm-orange hover:bg-warm-orange/90 text-white"
            >
              Give Points
            </Button>
          </motion.div>
        )}

        {['givingPoints', 'givingPointsAfterBuzz', 'finishingRound', 'finishingRoundAfterBuzz', 'finishingAfterAnswerAlone'].includes(gameState.phase) && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Button onClick={handleNextRound} size="sm" className="bg-warm-orange hover:bg-warm-orange/90 text-white">
              Next Round
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
