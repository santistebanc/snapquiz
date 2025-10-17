import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { Button } from "../components/ui/button";
import { Container } from "../components/ui/container";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { InRoundContent } from "../components/InRoundContent";

export default function InRound() {
  const { gameState, serverAction } = useGameStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Open drawer when GIVING_POINTS phase starts
  useEffect(() => {
    if (gameState.phase === 'givingPoints') setDrawerOpen(true);
  }, [gameState.phase]);

  const handleResetGame = () => serverAction("resetGame");
  const handleNextRound = () => serverAction("nextRound");

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      
      {/* Top right corner buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {gameState.phase === 'finishingRound' && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Button onClick={handleNextRound} size="sm" className="bg-[#c75d37] hover:bg-[#c75d37]/90 text-white">
              Next Round
            </Button>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Button onClick={handleResetGame} size="sm" className="bg-[#c75d37] hover:bg-[#c75d37]/90 text-white">
            Reset
          </Button>
        </motion.div>
      </div>

      <motion.div
        layout
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="w-full max-w-4xl text-center space-y-6"
      >
        <InRoundContent isPlayerMode={false} />
      </motion.div>
    </Container>
  );
}
