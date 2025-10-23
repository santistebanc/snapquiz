import { Container } from "../components/ui/container";
import { GameOver as GameOverComponent } from "../components/GameOver";

export default function GameOver() {
  return (
    <Container variant="page">
      <GameOverComponent isPlayerMode={false} />
    </Container>
  );
}

