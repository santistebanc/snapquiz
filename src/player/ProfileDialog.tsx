import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import {
  generateAvatarUrl,
  getStoredPlayerName,
  getStoredPlayerAvatar,
  getAvailableAvatars,
  getPlayerAvatar,
} from "../utils";
import {
  useGameStore,
  useCurrentPlayerName,
  useCurrentPlayerAvatar,
} from "../store";

interface ProfileDialogProps {
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ onOpenChange }: ProfileDialogProps) {
  const { sendMessage, connectionId } = useGameStore();
  const playerName = useCurrentPlayerName();
  const playerAvatar = useCurrentPlayerAvatar();

  const nameToUse = playerName || getStoredPlayerName() || "";
  const avatarToUse =
    playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar();

  // Internal state for the dialog
  const [editName, setEditName] = useState(nameToUse);
  const [editAvatar, setEditAvatar] = useState(avatarToUse);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const availableAvatars = useMemo(() => getAvailableAvatars(), []);

  if (nameInputRef.current) {
    nameInputRef.current.focus();
    nameInputRef.current.select();
  }

  const handleProfileSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editName.trim() && editAvatar) {
        // Send single changeProfile message with both name and avatar
        sendMessage({
          type: "changeProfile",
          data: {
            name: editName.trim().toUpperCase(),
            avatar: editAvatar,
            connectionId,
          },
        });

        // Close dialog
        onOpenChange(false);
      }
    },
    [editName, editAvatar, sendMessage, connectionId, onOpenChange]
  );

  const handleProfileCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAvatarSelect = useCallback((avatar: string) => {
    setEditAvatar(avatar);
  }, []);
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Player Name Section */}
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
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

          {/* Avatar Section */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex justify-center">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src={generateAvatarUrl(editAvatar)}
                  alt="Current avatar"
                />
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
                      <AvatarImage
                        src={generateAvatarUrl(avatar)}
                        alt={avatar}
                      />
                    </Avatar>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleProfileCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!editName.trim() || !editAvatar}
              className="flex-1"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
