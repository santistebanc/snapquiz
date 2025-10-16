import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useGameStore } from "../store";
import { generateQRCode, generateAvatarUrl } from "../utils";
import type { Player } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { Container } from "../components/ui/container";
import { Text } from "../components/ui/text";
import { StatusIndicator } from "../components/ui/status-indicator";
import { Centered } from "../components/ui/centered";

export default function Lobby() {
  const { gameState, sendMessage } = useGameStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode(gameState.roomId).then(setQrCodeDataUrl);
  }, [gameState.roomId]);

  const handleStartGame = useCallback(() => {
    sendMessage({
      type: "startGame",
      data: {},
    });
  }, [sendMessage]);

  const playersList = useMemo(() => {
    return Object.values(gameState.players);
  }, [gameState.players]);

  return (
    <Container variant="page">
      <Container variant="section" className="w-full max-w-6xl">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-4xl">SnapQuiz</CardTitle>
              <Button 
                onClick={handleStartGame} 
                size="lg" 
                disabled={Object.keys(gameState.players).length === 0}
              >
                {Object.keys(gameState.players).length === 0 ? "Waiting for players..." : "Start Game"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Room ID and QR Code */}
          <div className="space-y-6">
            <Card>
              <CardContent className="text-center p-6 space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg font-mono">
                  <span className="text-muted-foreground">Room:</span>
                  <span className="font-bold">{gameState.roomId}</span>
                </div>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code to join game"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20 mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Player List */}
          <Card>
            <CardContent className="p-4">
              {Object.keys(gameState.players).length === 0 ? (
                <Centered className="py-8">
                  <div className="space-y-2">
                    <Text variant="large">No players joined yet</Text>
                    <Text variant="muted">Share the room code or QR code to invite players</Text>
                  </div>
                </Centered>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {playersList.map((player: Player) => (
                      <Card key={player.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage 
                                src={generateAvatarUrl(player.avatar || 'robot-1')}
                                alt={`${player.name} avatar`}
                              />
                            </Avatar>
                            <Text variant="medium">{player.name}</Text>
                          </div>
                          <StatusIndicator status="online" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </Container>
  );
}
