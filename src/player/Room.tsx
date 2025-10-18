import React, { useState, useRef, useCallback } from "react";
import { useGameStore } from "../store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Room() {
  const { serverState } = useGameStore();
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomId, setEditRoomId] = useState(serverState.roomId);
  const roomInputRef = useRef<HTMLInputElement>(null);

  const handleRoomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editRoomId.trim()) {
        const capitalizedRoomId = editRoomId.trim().toUpperCase();

        // Update URL with new room and reload
        const url = new URL(window.location.href);
        url.searchParams.set("room", capitalizedRoomId);
        window.history.replaceState({}, "", url.toString());
        window.location.reload();
      }
    },
    [editRoomId]
  );


  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <form onSubmit={handleRoomSubmit} className="flex items-center gap-2">
        <span className="text-warm-yellow font-medium text-xl">Room:</span>
        <Input
          ref={roomInputRef}
          type="text"
          value={editRoomId}
          onChange={(e) => setEditRoomId(e.target.value.toUpperCase())}
          onFocus={() => setIsEditingRoom(true)}
          onBlur={() => {
            // Delay to allow submit to complete
            setTimeout(() => setIsEditingRoom(false), 150);
          }}
          placeholder="Enter room code..."
          className="text-center font-mono uppercase h-12 cursor-pointer transition-all duration-200 bg-card-dark/60 text-warm-cream border-border-muted/30"
          style={{ fontSize: '1.5rem' }}
          maxLength={4}
          readOnly={!isEditingRoom}
        />
        <div className={`transition-all duration-200 ${isEditingRoom ? 'w-auto opacity-100 ml-2' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
          <Button
            type="submit"
            disabled={!editRoomId.trim()}
            className="h-12 px-4 whitespace-nowrap text-lg"
          >
            Join
          </Button>
        </div>
      </form>
    </div>
  );
}
