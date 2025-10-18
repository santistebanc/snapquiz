import React from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Text } from "../components/ui/text";

export default function Setup() {
  return (
    <Container variant="page">
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
          <CardContent className="p-8 text-center space-y-6">
            <Text variant="large" className="text-warm-cream text-4xl font-bold mb-4">
              Game Setup
            </Text>
            
            <Text variant="large" className="text-warm-cream/80 mb-6">
              Configure your game settings here
            </Text>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}