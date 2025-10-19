import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { useGameConnection } from "./useGameConnection";
import { useGameStore } from "./store";
import { useParticles } from "./hooks/useParticles";
import ScreenLobby from "./screen/lobby";
import ScreenInRound from "./screen/inRound";
import ScreenSetup from "./screen/setup";
import PlayerLobby from "./player/lobby";
import PlayerInRound from "./player/inRound";
import PlayerSetup from "./player/setup";
import { Container } from "./components/ui/container";
import { Spinner } from "./components/ui/spinner";
import { ScreenButtons } from "./components/ScreenButtons";

// Screen wrapper with buttons outside view containers
function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScreenButtons />
      {children}
    </>
  );
}

function App() {
  const { isConnected, isPlayer } = useGameConnection();
  const { gameState, view } = useGameStore();

  // Initialize particles background
  useParticles();

  if (!isConnected || gameState.phase === 'loading') {
    return (
      <Container variant="page">
        <Spinner variant="dots" />
      </Container>
    );
  }

  // Determine what to render based on view state
  if (isPlayer) {
    // Player mode - show lobby, setup, or game based on view
    if (view === 'setup') {
      return <PlayerSetup />;
    }
    if (view === 'game') {
      if (gameState.phase === 'lobby') return <PlayerLobby />;
      return <PlayerInRound />;
    }
    return <PlayerLobby />;
  }

  // Screen mode - show lobby, setup, or game based on view with wrapper
  if (view === 'setup') {
    return (
      <ScreenWrapper>
        <ScreenSetup />
      </ScreenWrapper>
    );
  }

  if (view === 'game') {
    if (gameState.phase === 'lobby') {
      return (
        <ScreenWrapper>
          <ScreenLobby />
        </ScreenWrapper>
      );
    }
    return (
      <ScreenWrapper>
        <ScreenInRound />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScreenLobby />
    </ScreenWrapper>
  );
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);
