import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Container } from "../components/ui/container";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { InRoundContent } from "./inRoundContent";
import { AdminButtons } from "../components/AdminButtons";

export default function InRound() {
  const { gameState } = useGameStore();

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        isPlayerMode={true}
      />
      <AdminButtons />
      <motion.div
        layout
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="w-full max-w-2xl text-center"
      >
        <InRoundContent />
      </motion.div>
    </Container>
  );
}