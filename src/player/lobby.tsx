import React, { useState } from "react";
import { Profile } from "./Profile";
import { Room } from "./Room";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";

export default function Lobby() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <Container variant="page">
      <Card className="bg-[#2d3a3b]/60 backdrop-blur-sm border-[#6f817e]/30">
        <CardContent className="p-6">
          {!isEditingProfile && <Room />}
          <Profile onEditChange={setIsEditingProfile} />
        </CardContent>
      </Card>
    </Container>
  );
}
