import React, { useState } from "react";
import { Profile } from "./Profile";
import { Room } from "./Room";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";

export default function Lobby() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <Container variant="page">
      <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
        <CardContent className="p-6">
          {!isEditingProfile && <Room />}
          <Profile onEditChange={setIsEditingProfile} />
        </CardContent>
      </Card>
    </Container>
  );
}