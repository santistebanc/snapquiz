import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGameStore, useCurrentPlayerName, useCurrentPlayerAvatar } from "../store";
import { getStoredPlayerName, getStoredPlayerAvatar, getAvailableAvatars, generateAvatarUrl, getPlayerAvatar } from "../utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Container } from "../components/ui/container";
import { Label } from "../components/ui/label";
import { Text } from "../components/ui/text";
import { cn } from "../lib/utils";

export default function Lobby() {
  const { gameState, sendMessage, connectionId } = useGameStore();
  const playerName = useCurrentPlayerName();
  const playerAvatar = useCurrentPlayerAvatar();
  const storedPlayerName = getStoredPlayerName();
  const storedPlayerAvatar = getStoredPlayerAvatar();
  const [isEditingName, setIsEditingName] = useState(!storedPlayerName);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [editName, setEditName] = useState(
    playerName || storedPlayerName || ""
  );
  const [editRoomId, setEditRoomId] = useState(gameState.roomId);
  const [editAvatar, setEditAvatar] = useState(
    playerAvatar || storedPlayerAvatar || getPlayerAvatar()
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);
  const availableAvatars = useMemo(() => getAvailableAvatars(), []);

  // Auto-focus name input if no name exists
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

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

  const handleNameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      const capitalizedName = editName.trim().toUpperCase();
      const currentAvatar = playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar();

      // Send changePlayerName message with current avatar (server will truncate if needed)
      sendMessage({
        type: "changePlayerName",
        data: { name: capitalizedName, avatar: currentAvatar, connectionId },
      });

      // Exit edit mode manually
      setIsEditingName(false);
    } else {
      console.log("editName is empty:", editName);
    }
  }, [editName, playerAvatar, sendMessage, connectionId]);

  const handleNameClick = useCallback(() => {
    // Use playerName from server, or fallback to localStorage if empty
    const nameToUse = playerName || getStoredPlayerName() || "";
    setEditName(nameToUse);
    setIsEditingName(true);
  }, [playerName]);

  const handleNameCancel = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleAvatarClick = useCallback(() => {
    const avatarToUse = playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar();
    setEditAvatar(avatarToUse);
    setIsEditingAvatar(true);
  }, [playerAvatar]);

  const handleAvatarSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editAvatar) {
      // Send changePlayerAvatar message
      sendMessage({
        type: "changePlayerAvatar",
        data: { avatar: editAvatar, connectionId },
      });

      // Exit edit mode manually
      setIsEditingAvatar(false);
    }
  }, [editAvatar, sendMessage, connectionId]);

  const handleAvatarCancel = useCallback(() => {
    setIsEditingAvatar(false);
  }, []);

  const handleAvatarSelect = useCallback((avatar: string) => {
    setEditAvatar(avatar);
  }, []);

  return (
    <Container variant="page">
      <Container variant="section" className="w-full max-w-md">
        {/* Room and Player Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Room:</CardTitle>
              <Dialog open={isEditingRoom} onOpenChange={setIsEditingRoom}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-20 text-2xl font-mono"
                  >
                    {gameState.roomId}
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
          <CardContent className="space-y-4">
            {/* Player Name */}
            <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-20 text-2xl"
                >
                  {playerName || "Enter Name"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Name</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">
                      Player Name
                    </Label>
                    <Input
                      id="playerName"
                      ref={nameInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value.toUpperCase())}
                      placeholder="Your name here..."
                      className="text-center uppercase"
                      maxLength={20}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNameCancel}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!editName.trim()}
                      className="flex-1"
                    >
                      Save Name
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Player Avatar */}
            <Dialog open={isEditingAvatar} onOpenChange={setIsEditingAvatar}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-20"
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={generateAvatarUrl(playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar())}
                      alt="Player avatar"
                    />
                  </Avatar>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Avatar</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAvatarSubmit} className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={generateAvatarUrl(editAvatar)} alt="Current avatar" />
                    </Avatar>
                  </div>
                  <Separator />
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-5 gap-2 p-2">
                      {availableAvatars.map((avatar) => (
                        <Button
                          key={avatar}
                          type="button"
                          variant={editAvatar === avatar ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleAvatarSelect(avatar)}
                          className="h-16 w-16"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={generateAvatarUrl(avatar)} alt={avatar} />
                          </Avatar>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAvatarCancel}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!editAvatar}
                      className="flex-1"
                    >
                      Save Avatar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </Container>
    </Container>
  );
}
