import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { useGameConnection } from "./useGameConnection";
import { useGameStore, useCurrentPlayer } from "./store";
import { useParticles } from "./hooks/useParticles";
import { AudioProvider } from "./contexts/AudioContext";
import { AudioPreloader } from "./components/AudioPreloader";
import ScreenLobby from "./screen/lobby";
import ScreenInRound from "./screen/inRound";
import ScreenSettings from "./screen/settings";
import ScreenGameOver from "./screen/gameOver";
import PlayerLobby from "./player/lobby";
import PlayerInRound from "./player/inRound";
import PlayerSettings from "./player/settings";
import PlayerGameOver from "./player/gameOver";
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
  const currentPlayer = useCurrentPlayer();

  // Initialize particles background
  useParticles();

  if (!isConnected || gameState.phase === 'loading') {
    return (
      <Container variant="page">
        <Spinner variant="dots" />
      </Container>
    );
  }

  // Wrap the entire app with AudioProvider to preload all question audios
  return (
    <AudioProvider questions={gameState.questions}>
      <AudioPreloader isPlayerMode={isPlayer} />
      {(() => {
        // Determine what to render based on view state
        if (isPlayer) {
        // Player mode - show lobby, settings, or game based on view
        if (view === 'settings') {
          return <PlayerSettings />;
        }
        if (view === 'game') {
          // Players without a name stay in lobby even when game starts
          if (gameState.phase === 'lobby' || !currentPlayer?.name) return <PlayerLobby />;
          if (gameState.phase === 'gameOver') return <PlayerGameOver />;
          return <PlayerInRound />;
        }
        return <PlayerLobby />;
        }

        // Screen mode - show lobby, settings, or game based on view with wrapper
        if (view === 'settings') {
          return (
            <ScreenWrapper>
              <ScreenSettings />
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
          if (gameState.phase === 'gameOver') {
            return (
              <ScreenWrapper>
                <ScreenGameOver />
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
      })()}
    </AudioProvider>
  );
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);
root.render(<App />);
