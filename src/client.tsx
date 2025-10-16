import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { useGameConnection } from "./useGameConnection";
import { useGameStore } from "./store";
import ScreenLobby from "./screen/lobby";
import ScreenInRound from "./screen/inRound";
import PlayerLobby from "./player/lobby";
import PlayerInRound from "./player/inRound";
import { Card, CardContent } from "./components/ui/card";
import { Container } from "./components/ui/container";
import { Spinner } from "./components/ui/spinner";
import { Text } from "./components/ui/text";

function App() {
  const { isConnected, isPlayer } = useGameConnection();
  const { gameState, connectionId } = useGameStore();

  if (!isConnected) {
    return (
      <Container variant="page">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Spinner size="md" className="mx-auto mb-4" />
            <Text variant="large" className="mb-4">Connecting to game...</Text>
            <Spinner variant="dots" />
          </CardContent>
        </Card>
      </Container>
    );
  }

  const isInGame = gameState.phase !== 'lobby';
  const isPlayerInGame = isPlayer && isInGame && connectionId && gameState.players[connectionId];

  if (isPlayer) {
    return isPlayerInGame ? <PlayerInRound /> : <PlayerLobby />;
  }

  return isInGame ? <ScreenInRound /> : <ScreenLobby />;
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);
