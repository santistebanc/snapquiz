import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../store";
import { generateQRCode, generateAvatarUrl } from "../utils";
import type { Player } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { Container } from "../components/ui/container";
import { Text } from "../components/ui/text";
import { StatusIndicator } from "../components/ui/status-indicator";
import { Centered } from "../components/ui/centered";
import { Badge } from "../components/ui/badge";

export default function Lobby() {
  const { gameState, serverAction } = useGameStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode(gameState.roomId).then(setQrCodeDataUrl);
  }, [gameState.roomId]);

  const handleStartGame = useCallback(() => {
    serverAction("startGame");
  }, [serverAction]);

  const playersList = useMemo(() => {
    return Object.values(gameState.players);
  }, [gameState.players]);

  return (
    <Container variant="page">
      {/* Top right corner button */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Button
            onClick={handleStartGame}
            size="sm"
            className="bg-warm-orange hover:bg-warm-orange/90 text-white"
            disabled={Object.keys(gameState.players).length === 0}
          >
            {Object.keys(gameState.players).length === 0 ? "Waiting for players..." : "Start Game"}
          </Button>
        </motion.div>
      </div>

      <Container variant="section" className="w-full max-w-6xl">

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[70vh]">
          {/* Left Section - QR Code and Room ID */}
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-4xl font-mono">
                <span className="text-warm-yellow">Room:</span>
                <div 
                  className="text-warm-cream px-4 py-2 rounded-lg font-bold border bg-card-dark/60 border-border-muted/30"
                >
                  {gameState.roomId}
                </div>
              </div>
            </div>
            
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code to join game"
                className="w-80 h-80 mx-auto"
              />
            ) : (
              <div className="w-80 h-80 bg-muted rounded-lg flex items-center justify-center mx-auto">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Player List */}
          <div className="flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h2 className="text-4xl font-bold text-warm-cream">Players</h2>
                <Badge className="bg-teal-secondary text-white text-lg font-bold px-3 py-1">
                  {Object.keys(gameState.players).length}
                </Badge>
              </div>
            </div>
            
            {Object.keys(gameState.players).length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {playersList.map((player: Player) => (
                  <div key={player.id} className="flex items-center justify-between p-4 rounded-lg border border-border-muted/30 bg-card-dark/60">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={generateAvatarUrl(player.avatar || 'robot-1')}
                          alt={`${player.name} avatar`}
                        />
                      </Avatar>
                      <Text variant="large" className="text-warm-cream text-xl">{player.name}</Text>
                    </div>
                    <StatusIndicator status="online" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Container>
  );
}
