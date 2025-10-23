import { Container } from "../components/ui/container";
import { GameOver as GameOverComponent } from "../components/GameOver";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { useGameStore } from "../store";

export default function GameOver() {
  const { gameState } = useGameStore();

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        isPlayerMode={true}
      />
      <GameOverComponent isPlayerMode={true} />
    </Container>
  );
}

