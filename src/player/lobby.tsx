import React, { useState, useEffect, useRef, useCallback } from "react";
import { Activity } from "react";
import { useGameStore, useCurrentPlayerName, useCurrentPlayerAvatar } from "../store";
import { ProfileDialog } from "./ProfileDialog";

import { getStoredPlayerName, getStoredPlayerAvatar, generateAvatarUrl, getPlayerAvatar } from "../utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Container } from "../components/ui/container";
import { Label } from "../components/ui/label";
import { Text } from "../components/ui/text";
import { cn } from "../lib/utils";

export default function Lobby() {
  const { gameState, sendMessage, connectionId } = useGameStore();
  const playerName = useCurrentPlayerName();
  const playerAvatar = useCurrentPlayerAvatar();
  const [isEditingProfile, setIsEditingProfile] = useState(!getStoredPlayerName());
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomId, setEditRoomId] = useState(gameState.roomId);
  const roomInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus room input when editing
  useEffect(() => {
    if (isEditingRoom && roomInputRef.current) {
      roomInputRef.current.focus();
      roomInputRef.current.select();
    }
  }, [isEditingRoom]);

  const handleRoomClick = useCallback(() => {
    setEditRoomId(gameState.roomId);
    setIsEditingRoom(true);
  }, [gameState.roomId]);

  const handleRoomSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editRoomId.trim()) {
      const capitalizedRoomId = editRoomId.trim().toUpperCase();

      // Update URL with new room and reload
      const url = new URL(window.location.href);
      url.searchParams.set("room", capitalizedRoomId);
      window.history.replaceState({}, "", url.toString());
      window.location.reload();
    }
  }, [editRoomId]);

  const handleRoomCancel = useCallback(() => {
    setIsEditingRoom(false);
  }, []);


  const handleProfileClick = useCallback(() => {
    setIsEditingProfile(true);
  }, []);

  return (
    <Container variant="page">
      <Container variant="section" className="w-full max-w-md">
        {/* Room and Player Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-center">
              <Dialog open={isEditingRoom} onOpenChange={setIsEditingRoom}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 text-lg font-mono px-4 flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">Room:</span>
                    <span className="font-bold">{gameState.roomId}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Room</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomId">
                        Room Code
                      </Label>
                      <Input
                        id="roomId"
                        ref={roomInputRef}
                        type="text"
                        value={editRoomId}
                        onChange={(e) => setEditRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter room code..."
                        className="text-center font-mono uppercase"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRoomCancel}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!editRoomId.trim()}
                        className="flex-1"
                      >
                        Join Room
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {/* Player Profile with Activity preloading */}
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-16 text-xl flex items-center gap-3"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={generateAvatarUrl(playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar())}
                      alt="Player avatar"
                    />
                  </Avatar>
                  <span>{playerName || "Enter Name"}</span>
                </Button>
              </DialogTrigger>
              
              {/* Preload ProfileDialog with React Activity */}
              <Activity mode={isEditingProfile ? "visible" : "hidden"}>
                <ProfileDialog
                  isOpen={isEditingProfile}
                  onOpenChange={setIsEditingProfile}
                />
              </Activity>
            </Dialog>
          </CardContent>
        </Card>
      </Container>
    </Container>
  );
}
