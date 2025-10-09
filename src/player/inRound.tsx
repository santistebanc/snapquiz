import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { Text } from "../components/ui/text";

export default function InRound() {
  return (
    <Container variant="page">
      <Card className="w-full max-w-2xl">
        <CardContent className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">In Round</h1>
          <Text variant="muted" className="text-lg">
            Waiting for the game to continue...
          </Text>
        </CardContent>
      </Card>
    </Container>
  );
}
