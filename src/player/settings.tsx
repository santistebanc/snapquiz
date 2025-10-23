import React from "react";
import { Container } from "../components/ui/container";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Text } from "../components/ui/text";
import { useGameStore } from "../store";

export default function Settings() {
  const { setView } = useGameStore();

  return (
    <Container variant="page">
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <Card className="bg-card-dark/60 backdrop-blur-sm border-border-muted/30">
          <CardContent className="p-8 text-center space-y-6">
            <Text variant="large" className="text-warm-cream text-4xl font-bold mb-4">
              Player Settings
            </Text>
            
            <Text variant="large" className="text-warm-cream/80 mb-6">
              Configure your player settings here
            </Text>

            <div className="space-y-4">
              <Button 
                onClick={() => setView('lobby')}
                className="bg-teal-primary hover:bg-teal-primary/90 text-white w-full"
              >
                Back to Lobby
              </Button>
              
              <Button 
                onClick={() => setView('game')}
                className="bg-teal-primary hover:bg-teal-primary/90 text-white w-full"
              >
                Join Game
              </Button>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-2 pt-4 border-t border-border-muted/30">
              <Button 
                onClick={() => setView('lobby')}
                size="sm"
                className="bg-teal-primary hover:bg-teal-primary/90 text-white flex-1"
              >
                Lobby
              </Button>
              <Button 
                onClick={() => setView('settings')}
                size="sm"
                className="bg-teal-primary hover:bg-teal-primary/90 text-white flex-1"
              >
                Settings
              </Button>
              <Button 
                onClick={() => setView('game')}
                size="sm"
                className="bg-teal-primary hover:bg-teal-primary/90 text-white flex-1"
              >
                Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}