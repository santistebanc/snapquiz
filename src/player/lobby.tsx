import React, { useState } from "react";
import { Profile } from "./Profile";
import { Room } from "./Room";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { PlayerDrawer } from "../components/PlayerDrawer";
import { MicrophoneTest } from "../components/MicrophoneTest";
import { useGameStore } from "../store";

export default function Lobby() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { gameState } = useGameStore();

  return (
    <Container variant="page">
      <PlayerDrawer
        players={Object.values(gameState.players)}
        isPlayerMode={true}
      />
      <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
        <CardContent className="p-6">
          {!isEditingProfile && <Room />}
          <Profile onEditChange={setIsEditingProfile} />
        </CardContent>
      </Card>
      
      {/* Microphone Test Section */}
      <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
        <CardContent className="p-6">
          <MicrophoneTest isPlayerMode={true} />
        </CardContent>
      </Card>
    </Container>
  );
}