import React, { useState } from "react";
import { Profile } from "./Profile";
import { Room } from "./Room";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { MicrophoneTest } from "../components/MicrophoneTest";
import { useGameStore } from "../store";

export default function Lobby() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);
  const { gameState } = useGameStore();

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        isPlayerMode={true}
      />
      <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
        <CardContent className="p-6">
          {showMicrophoneTest ? (
            // Microphone Test Section
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-warm-cream">Microphone Test</h2>
                <Button
                  onClick={() => setShowMicrophoneTest(false)}
                  size="sm"
                  variant="outline"
                  className="border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
                >
                  Close
                </Button>
              </div>
              <MicrophoneTest isPlayerMode={true} />
            </div>
          ) : (
            // Normal Lobby Content
            <>
              {!isEditingProfile && <Room />}
              <Profile 
                onEditChange={setIsEditingProfile} 
                onMicrophoneTest={() => setShowMicrophoneTest(true)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}