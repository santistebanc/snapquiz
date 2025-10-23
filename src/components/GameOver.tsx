import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useGameStore } from "../store";
import type { Player, Round } from "../types";

interface GameOverProps {
  isPlayerMode?: boolean;
}

interface PlayerStats extends Player {
  rank: number;
  correctAnswers: number;
  wrongAnswers: number;
}

const RANK_EMOJIS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function GameOver({ isPlayerMode = false }: GameOverProps) {
  const { gameState } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    // Handle window resize for confetti
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);

    // Stop confetti after 10 seconds
    const timer = setTimeout(() => setShowConfetti(false), 10000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Calculate stats for each player
  const playersWithStats: PlayerStats[] = Object.values(gameState.players).map((player: Player) => {
    let correctAnswers = 0;
    let wrongAnswers = 0;

    gameState.rounds.forEach((round: Round) => {
      const question = gameState.questions.find(q => q.id === round.questionId);
      if (!question) return;

      const playerAnswer = round.playerAnswers[player.id];
      if (playerAnswer) {
        if (playerAnswer === question.answer) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
    });

    return {
      ...player,
      rank: 0,
      correctAnswers,
      wrongAnswers,
    };
  });

  // Sort by points and assign ranks
  playersWithStats.sort((a, b) => b.points - a.points);
  playersWithStats.forEach((player, index) => {
    player.rank = index + 1;
  });

  const winner = playersWithStats[0];
  const otherPlayers = playersWithStats.slice(1);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className={`w-full space-y-6 ${isPlayerMode ? "max-w-md" : "max-w-4xl"}`}
      >
        {/* Winner Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`${isPlayerMode ? "text-6xl" : "text-9xl"}`}
          >
            🏆
          </motion.div>
          
          <div className={`font-bold text-warm-yellow ${isPlayerMode ? "text-3xl" : "text-6xl"}`}>
            {winner.name} Wins!
          </div>

          <div className={`font-bold text-warm-cream ${isPlayerMode ? "text-2xl" : "text-5xl"}`}>
            {winner.points} points
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`flex justify-center gap-4 text-warm-cream/80 ${isPlayerMode ? "text-sm" : "text-xl"}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-correct-green">✓</span>
              <span>{winner.correctAnswers} correct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-wrong-red">✗</span>
              <span>{winner.wrongAnswers} wrong</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-3"
          >
            {otherPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className={`bg-card-dark/60 border-2 border-border-muted/30 rounded-lg p-4 ${
                  isPlayerMode ? "p-3" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${isPlayerMode ? "text-2xl" : "text-4xl"}`}>
                      {RANK_EMOJIS[player.rank as keyof typeof RANK_EMOJIS] || `#${player.rank}`}
                    </div>
                    <div>
                      <div className={`font-bold text-warm-cream ${isPlayerMode ? "text-lg" : "text-2xl"}`}>
                        {player.name}
                      </div>
                      <div className={`flex gap-3 text-warm-cream/70 ${isPlayerMode ? "text-xs" : "text-sm"}`}>
                        <span className="text-correct-green">✓ {player.correctAnswers}</span>
                        <span className="text-wrong-red">✗ {player.wrongAnswers}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-warm-yellow ${isPlayerMode ? "text-xl" : "text-3xl"}`}>
                    {player.points}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

