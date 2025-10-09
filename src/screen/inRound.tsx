import React from "react";
import { useGameStore } from "../store";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";

export default function InRound() {
  const { sendMessage } = useGameStore();

  const handleResetGame = () => {
    sendMessage({
      type: "resetGame",
      data: {},
    });
  };

  return (
    <Container variant="page">
      <Card className="w-full max-w-2xl">
        <CardContent className="text-center p-8 space-y-6">
          <h1 className="text-4xl font-bold">In Round</h1>
          <Button onClick={handleResetGame} size="lg">
            Reset Game
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
