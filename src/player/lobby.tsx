import React, { useState } from "react";
import { Profile } from "./Profile";
import { Room } from "./Room";
import { Container } from "../components/ui/container";

export default function Lobby() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <Container variant="page">
      {!isEditingProfile && <Room />}
      <Profile onEditChange={setIsEditingProfile} />
    </Container>
  );
}
