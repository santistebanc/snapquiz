import { useGameStore } from "../store";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { InRoundContent } from "../components/InRoundContent";

export default function InRound() {
  const { gameState } = useGameStore();

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Array.from(gameState.players.values())}
        isPlayerMode={true}
      />
      <Card className="w-full max-w-2xl">
        <CardContent className="text-center p-8">
          <InRoundContent isPlayerMode={true} />
        </CardContent>
      </Card>
    </Container>
  );
}
