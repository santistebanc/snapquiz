import React, { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Button } from "./ui/button";
import { Home, Settings, Gamepad2 } from "lucide-react";

export function ScreenButtons() {
  const { gameState, view, setView, serverAction } = useGameStore();

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

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Action buttons (left side) */}
      <div className="flex gap-2">
        {view === 'game' && gameState.phase === 'finishingRound' && (
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

        {view !== 'setup' && (
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
                : "Reset Game"
              }
            </Button>
          </motion.div>
        )}
      </div>

      {/* Navigation buttons (right side) */}
      <div className="flex gap-2">
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

        {view !== 'setup' && gameState.phase === 'lobby' && (
          <Button
            onClick={() => setView('setup')}
            size="sm"
            variant="outline"
            className="border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}

        {view !== 'game' && (
          <Button
            onClick={() => setView('game')}
            size="sm"
            variant="outline"
            className="border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
          >
            <Gamepad2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
