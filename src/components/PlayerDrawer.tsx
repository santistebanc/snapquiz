import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Menu, RotateCcw, ArrowRight, Settings, Gamepad2, Play, RotateCcw as Restart } from "lucide-react";
import { generateAvatarUrl } from "../utils";
import { useGameStore } from "../store";
import type { Player } from "../types";

// Component for animating counter from previous to current value
function AnimatedCounter({ from, to }: { from: number; to: number }) {
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { 
    stiffness: 100, 
    damping: 30,
    duration: 0.8 
  });
  const display = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    motionValue.set(to);
  }, [to, motionValue]);

  return <motion.span>{display}</motion.span>;
}

interface PlayerDrawerProps {
  players: Player[];
  isPlayerMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlayerDrawer({ players, isPlayerMode = false, open: externalOpen, onOpenChange }: PlayerDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [previousPoints, setPreviousPoints] = useState<Record<string, number>>({});
  const { gameState, connectionId, serverAction, setView, view } = useGameStore();
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  
  // Check if current player is admin
  const currentPlayer = connectionId ? gameState.players[connectionId] : null;
  const isCurrentPlayerAdmin = currentPlayer?.isAdmin || false;

  // Track point changes for animation
  useEffect(() => {
    const newPreviousPoints: Record<string, number> = {};
    players.forEach(player => {
      const previous = previousPoints[player.id] || 0;
      newPreviousPoints[player.id] = player.points > previous ? previous : player.points;
    });
    setPreviousPoints(newPreviousPoints);
  }, [players, previousPoints]);

  return (
    <>
      {/* Toggle Button */}
      <Button
        size="icon"
        className={`fixed top-4 left-4 z-50 transition-transform duration-200 bg-dark-green/20 text-warm-cream border-border-muted/30 hover:bg-dark-green/30 ${
          open ? "translate-x-80" : "translate-x-0"
        }`}
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Slide-out Container */}
      <div
        className={`fixed top-0 left-0 w-80 z-40 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-3">
          {/* Admin Controls - only show for admin players */}
          {isCurrentPlayerAdmin && isPlayerMode && (
            <div className="space-y-2 mb-4 pb-4 border-b border-border-muted/30">
              <div className="text-xs font-semibold text-warm-cream/60 uppercase tracking-wide">
                Admin Controls
              </div>
              <div className="space-y-2">
                {/* Start Game Button - only show in lobby */}
                {gameState.phase === 'lobby' && (
                  <Button
                    onClick={() => {
                      setView('game');
                      serverAction("startGame");
                    }}
                    size="sm"
                    className="w-full bg-warm-orange hover:bg-warm-orange/90 text-white text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                )}
                
                {/* Next Round Button - show during appropriate phases */}
                {['givingPoints', 'givingPointsAfterBuzz', 'finishingRound', 'finishingRoundAfterBuzz', 'finishingAfterAnswerAlone'].includes(gameState.phase) && (
                  <Button
                    onClick={() => serverAction("nextRound")}
                    size="sm"
                    className="w-full bg-warm-orange hover:bg-warm-orange/90 text-white text-sm"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Next Round
                  </Button>
                )}
                
                {/* Reset Game Button - show when game is active */}
                {gameState.phase !== 'lobby' && gameState.phase !== 'gameOver' && (
                  <Button
                    onClick={() => serverAction("resetGame")}
                    size="sm"
                    className="w-full bg-warm-orange hover:bg-warm-orange/90 text-white text-sm"
                  >
                    <Restart className="w-4 h-4 mr-2" />
                    Reset Game
                  </Button>
                )}
                {view !== 'settings' && (
                  <Button
                    onClick={() => setView('settings')}
                    size="sm"
                    variant="outline"
                    className="w-full border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                )}
                {view !== 'game' && (
                  <Button
                    onClick={() => setView('game')}
                    size="sm"
                    variant="outline"
                    className="w-full border-teal-primary text-teal-primary bg-card-dark/60 hover:bg-teal-primary hover:text-white"
                  >
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Back to Game
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card-dark/40 backdrop-blur-sm border-border-muted/20"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm font-medium text-warm-cream/80">
                    #{index + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={generateAvatarUrl(player.avatar)}
                      alt={player.name}
                    />
                  </Avatar>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-warm-cream" title={player.name}>
                    {player.name}
                  </p>
                </div>
              </div>
              <motion.div
                key={player.points}
                initial={{ scale: 1.2, color: "#10b981" }}
                animate={{ scale: 1, color: "#6b7280" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-shrink-0 ml-2"
              >
                <Badge className="bg-teal-secondary text-white hover:bg-teal-secondary/80 text-sm font-bold">
                  <AnimatedCounter 
                    from={previousPoints[player.id] || 0} 
                    to={player.points} 
                  />
                </Badge>
              </motion.div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No players yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}
