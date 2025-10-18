import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Card, CardContent } from "../components/ui/card";
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

interface ProfileProps {
  onEditChange?: (isEditing: boolean) => void;
}

export function Profile({ onEditChange }: ProfileProps) {
  const { serverAction, connectionId } = useGameStore();
  const playerName = useCurrentPlayerName();
  const playerAvatar = useCurrentPlayerAvatar();

  const nameToUse = playerName || getStoredPlayerName() || "";
  const avatarToUse =
    playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar();

  // Internal state for the dialog
  const [editName, setEditName] = useState(nameToUse);
  const [editAvatar, setEditAvatar] = useState(avatarToUse);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const availableAvatars = useMemo(() => getAvailableAvatars(), []);

  // Focus and select name input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
    // Notify parent component of edit state change
    onEditChange?.(isEditingName);
  }, [isEditingName, onEditChange]);

  const handleNameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      serverAction('changeProfile', connectionId, editName.trim().toUpperCase(), editAvatar);
      setIsEditingName(false);
    }
  }, [editName, editAvatar, serverAction, connectionId]);

  const handleAvatarSelect = useCallback((avatar: string) => setEditAvatar(avatar), []);
  return (
    <div className="space-y-3 bg-transparent pb-4">
      <div className={`flex items-start gap-4 p-4 bg-transparent z-20 ${isEditingName ? 'sm:relative fixed top-0 left-0 right-0' : ''}`}>
        {/* Player Name */}
        <div className="flex-1 space-y-2 min-w-0 p-1">
          <form onSubmit={handleNameSubmit} className={`flex items-center gap-2 ${isEditingName ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={generateAvatarUrl(editAvatar)}
                  alt="Current avatar"
                />
              </Avatar>
            </div>
            <Input
              ref={nameInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value.toUpperCase())}
              onFocus={() => setIsEditingName(true)}
              placeholder="Your name here..."
              className={`text-center font-mono uppercase h-12 cursor-pointer transition-all duration-200 bg-[#2d3a3b]/60 text-[#feecba] border-[#6f817e]/30 ${
                isEditingName ? 'max-w-xs' : 'flex-1'
              }`}
              style={{ fontSize: '1.5rem' }}
              maxLength={15}
              readOnly={!isEditingName}
            />
            <div
              className={`transition-all duration-200 ${isEditingName
                ? "w-auto opacity-100 ml-2"
                : "w-0 opacity-0 ml-0 overflow-hidden"
                }`}
            >
              <Button
                type="submit"
                disabled={!editName.trim()}
                className="h-12 px-4 whitespace-nowrap"
              >
                Save
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Avatar Selection - Only show when editing name */}
      {isEditingName && (
        <div className="space-y-2 flex-1 pt-20 sm:pt-4">
          <ScrollArea>
            <div className="grid grid-cols-3 min-[300px]:grid-cols-4 min-[400px]:grid-cols-5 min-[500px]:grid-cols-6 min-[600px]:grid-cols-7 min-[700px]:grid-cols-8 min-[800px]:grid-cols-9 gap-2 p-2">
              {availableAvatars.map((avatar) => (
                <Button
                  key={avatar}
                  type="button"
                  size="icon"
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`h-16 w-16 transition-all duration-200 hover:scale-105 ${
                    editAvatar === avatar 
                      ? "bg-[#c75d37] text-white border-[#c75d37] hover:bg-[#c75d37] hover:border-[#c75d37]" 
                      : "bg-[#2d3a3b]/60 text-[#feecba] border-[#6f817e]/30 hover:bg-[#2d3a3b]/80"
                  }`}
                  data-avatar-button
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={generateAvatarUrl(avatar)} alt={avatar} />
                  </Avatar>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
