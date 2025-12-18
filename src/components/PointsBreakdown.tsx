import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from "framer-motion";
import { useEffect, useState } from "react";
import { useGameStore } from "../store";
import type { Player } from "../types";

interface PointsBreakdownProps {
  isPlayerMode?: boolean;
}

interface PlayerWithPoints extends Player {
  pointChange: number;
  oldPoints: number;
  newPoints: number;
  oldRank: number;
  newRank: number;
}

// Animated counter component
function AnimatedCounter({ from, to }: { from: number; to: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const controls = motionAnimate(count, to, {
      duration: 0.8,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [from, to, count, rounded]);

  return <>{displayValue}</>;
}

const RANK_COLORS = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-orange-400",
};

const RANK_LABELS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function PointsBreakdown({ isPlayerMode = false }: PointsBreakdownProps) {
  const { gameState } = useGameStore();
  const [animatedPoints, setAnimatedPoints] = useState<Record<string, number>>({});
  const [playersData, setPlayersData] = useState<PlayerWithPoints[]>([]);

  // Safely access current round
  const currentRound = gameState.rounds && gameState.currentRound >= 1 && gameState.currentRound <= gameState.rounds.length
    ? gameState.rounds[gameState.currentRound - 1]
    : null;

  useEffect(() => {
    if (!currentRound) return;

    const players = Object.values(gameState.players) as Player[];
    
    // Calculate old and new points for each player
    const playersWithChanges: PlayerWithPoints[] = players.map(player => {
      const pointChange = currentRound.pointsAwarded[player.id] || 0;
      const newPoints = player.points;
      const oldPoints = newPoints - pointChange;
      
      return {
        ...player,
        pointChange,
        oldPoints,
        newPoints,
        oldRank: 0,
        newRank: 0,
      };
    });

    // Calculate old ranks (before points change)
    const sortedByOld = [...playersWithChanges].sort((a, b) => b.oldPoints - a.oldPoints);
    sortedByOld.forEach((player, index) => {
      const found = playersWithChanges.find(p => p.id === player.id);
      if (found) found.oldRank = index + 1;
    });

    // Calculate new ranks (after points change)
    const sortedByNew = [...playersWithChanges].sort((a, b) => b.newPoints - a.newPoints);
    sortedByNew.forEach((player, index) => {
      const found = playersWithChanges.find(p => p.id === player.id);
      if (found) found.newRank = index + 1;
    });

    // Initialize animated points to old points
    const initialPoints: Record<string, number> = {};
    playersWithChanges.forEach(player => {
      initialPoints[player.id] = player.oldPoints;
    });
    setAnimatedPoints(initialPoints);
    setPlayersData(sortedByNew);

    // Animate points to new values
    const timer = setTimeout(() => {
      const newAnimatedPoints: Record<string, number> = {};
      playersWithChanges.forEach(player => {
        newAnimatedPoints[player.id] = player.newPoints;
      });
      setAnimatedPoints(newAnimatedPoints);
    }, 500);

    return () => clearTimeout(timer);
  }, [gameState.phase, currentRound, gameState.players]);

  if (!currentRound) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed z-30 flex items-center justify-center bg-deep-purple/95 backdrop-blur-xl"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className={`w-full max-w-2xl mx-4 ${isPlayerMode ? "max-w-md" : ""}`}
      >
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {playersData.map((player, index) => {
              const rankChanged = player.oldRank !== player.newRank;
              const rankColor = RANK_COLORS[player.newRank as keyof typeof RANK_COLORS];
              const rankLabel = RANK_LABELS[player.newRank as keyof typeof RANK_LABELS];

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{
                    layout: { type: "spring", damping: 20, stiffness: 200 },
                    opacity: { duration: 0.2 },
                    delay: index * 0.1,
                  }}
                  className={`bg-card-dark/80 border-2 rounded-lg p-4 ${
                    player.pointChange > 0
                      ? "border-correct-green"
                      : player.pointChange < 0
                      ? "border-wrong-red"
                      : "border-border-muted/30"
                  } ${isPlayerMode ? "p-3" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <motion.div
                        layout
                        className={`${isPlayerMode ? "text-2xl" : "text-4xl"} ${rankColor}`}
                      >
                        {rankLabel || `#${player.newRank}`}
                      </motion.div>

                      {/* Player info */}
                      <div>
                        <div className={`font-bold text-warm-cream ${isPlayerMode ? "text-lg" : "text-2xl"}`}>
                          {player.name}
                        </div>
                        {rankChanged && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-sm ${isPlayerMode ? "text-xs" : ""} ${
                              player.newRank < player.oldRank
                                ? "text-correct-green"
                                : "text-wrong-red"
                            }`}
                          >
                            {player.newRank < player.oldRank
                              ? `↑ ${player.oldRank - player.newRank} ${player.oldRank - player.newRank === 1 ? "place" : "places"}`
                              : `↓ ${player.newRank - player.oldRank} ${player.newRank - player.oldRank === 1 ? "place" : "places"}`}
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Points display */}
                    <div className="flex items-center gap-4">
                      {/* Point change */}
                      {player.pointChange !== 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.3 + index * 0.1 }}
                          className={`font-bold ${isPlayerMode ? "text-lg" : "text-2xl"} ${
                            player.pointChange > 0
                              ? "text-correct-green"
                              : "text-wrong-red"
                          }`}
                        >
                          {player.pointChange > 0 ? "+" : ""}
                          {player.pointChange}
                        </motion.div>
                      )}

                      {/* Current points with animation */}
                      <motion.div
                        className={`font-bold text-warm-yellow ${isPlayerMode ? "text-xl" : "text-3xl"}`}
                      >
                        <AnimatedCounter 
                          from={player.oldPoints} 
                          to={animatedPoints[player.id] || player.newPoints} 
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

