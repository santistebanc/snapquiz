import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { generateAvatarUrl } from "../utils";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  setEditName: (name: string) => void;
  editAvatar: string;
  setEditAvatar: (avatar: string) => void;
  handleProfileSubmit: (e: React.FormEvent) => void;
  handleProfileCancel: () => void;
  handleAvatarSelect: (avatar: string) => void;
  availableAvatars: string[];
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProfileDialog({
  isOpen,
  onOpenChange,
  editName,
  setEditName,
  editAvatar,
  setEditAvatar,
  handleProfileSubmit,
  handleProfileCancel,
  handleAvatarSelect,
  availableAvatars,
  nameInputRef,
}: ProfileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Player Name Section */}
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

          {/* Avatar Section */}
          <div className="space-y-2">
            <Label>Avatar</Label>
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
