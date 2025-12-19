import React, { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Button } from "./ui/button";
import { Home, Settings, Gamepad2 } from "lucide-react";

export function ScreenButtons() {
  const { gameState, view, setView, serverAction, connectionId, isPlayer } = useGameStore();
  
  // Check if current connection is an admin player
  const currentPlayer = connectionId ? gameState.players[connectionId] : null;
  const isAdmin = currentPlayer?.isAdmin || false;
  
  // Determine if this is a screen device (not a player device)
  const isScreenDevice = !isPlayer;

  // Auto-change view from 'lobby' to 'game' when gameState.phase === 'lobby' and view === 'lobby'
  useEffect(() => {
    if (gameState.phase === 'lobby' && view === 'lobby') {
      setView('game');
    }
  }, [gameState.phase, view, setView]);

  const handleStartGame = useCallback(() => {
    setView('game');
    serverAction("startGame");
  }, [serverAction, setView]);

  const handleResetGame = useCallback(() => {
    serverAction("resetGame");
  }, [serverAction, setView]);

  const handleNextRound = useCallback(() => {
    serverAction("nextRound");
  }, [serverAction]);

  // Action buttons visibility:
  // - For admin players: always visible
  // - For screen devices: when game hasn't started (phase === 'lobby' OR phase === 'game'), OR game started and in lobby view
  const shouldShowActionButtons = isAdmin && (
    // Admin players always see buttons
    (isPlayer) ||
    // Screen devices see buttons when:
    // - Game hasn't started (phase === 'lobby' OR phase === 'game'), OR
    // - Game started and in lobby view (view === 'lobby')
    (isScreenDevice && (
      (gameState.phase === 'lobby' || gameState.phase === 'game') ||
      (gameState.phase !== 'lobby' && gameState.phase !== 'game' && view === 'lobby')
    ))
  );

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Action buttons (left side) - only show for admin players, in lobby view or game view when game hasn't started, or during gameplay */}
      {shouldShowActionButtons && (
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

        {view !== 'settings' && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          >
            <Button
              onClick={gameState.phase === 'lobby' ? handleStartGame : handleResetGame}
              size="sm"
              className="bg-warm-orange hover:bg-warm-orange/90 text-white"
              disabled={gameState.phase === 'lobby' && Object.keys(gameState.players).length === 0}
            >
              {gameState.phase === 'lobby'
                ? (Object.keys(gameState.players).length === 0 ? "Waiting for players..." : "Start Game")
                : gameState.phase === 'gameOver'
                ? "Finish"
                : "Reset Game"
              }
            </Button>
          </motion.div>
        )}
        </div>
      )}

      {/* Navigation buttons (right side) - show in lobby view, settings view, or game view when game hasn't started */}
      {(view !== 'game' || gameState.phase === 'lobby') && (
        <div className="flex gap-2">
          {/* Home button - show when not in lobby view, but only if game has started */}
          {view !== 'lobby' && gameState.phase !== 'lobby' && (
            <Button
              onClick={() => setView('lobby')}
              size="sm"
              variant="outline"
              className="border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
            >
              <Home className="h-4 w-4" />
            </Button>
          )}

          {/* Settings button - show when not in settings view */}
          {view !== 'settings' && (
            <Button
              onClick={() => setView('settings')}
              size="sm"
              variant="outline"
              className="border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Change view button (Gamepad2) - always visible in all views */}
      <div className="flex gap-2">
        <Button
          onClick={() => setView(view === 'game' ? 'lobby' : 'game')}
          size="sm"
          variant="outline"
          className="border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
        >
          <Gamepad2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
