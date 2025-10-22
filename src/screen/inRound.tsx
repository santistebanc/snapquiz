import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import { Container } from "../components/ui/container";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { InRoundContent } from "./inRoundContent";

export default function InRound() {
  const { gameState } = useGameStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Open drawer when GIVING_POINTS phase starts
  useEffect(() => {
    if (gameState.phase === 'givingPoints') setDrawerOpen(true);
  }, [gameState.phase]);

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <motion.div
        layout
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="w-full max-w-4xl text-center space-y-6"
      >
        <InRoundContent />
      </motion.div>
    </Container>
  );
}