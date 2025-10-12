import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { InRoundContent } from "../components/InRoundContent";

export default function InRound() {
  const { gameState, sendMessage } = useGameStore();

  const handleResetGame = () => {
    sendMessage({
      type: "resetGame",
      data: {},
    });
  };

  return (
    <Container variant="page">
      <PlayerDrawer players={Array.from(gameState.players.values())} />
      <motion.div
        layout
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
      >
        <Card className="w-full max-w-6xl">
          <CardContent className="text-center p-8 space-y-6">
            <InRoundContent isPlayerMode={false} />
            <div className="pt-8">
              <Button onClick={handleResetGame} size="lg">
                Reset Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
