import React, { useState, useEffect, useRef } from "react";
import { useGameStore, useCurrentPlayerName, useCurrentPlayerAvatar } from "./store";
import { getStoredPlayerName, getStoredPlayerAvatar, getAvailableAvatars, generateAvatarUrl, getPlayerAvatar } from "./utils";

export default function PlayerMode() {
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
  const availableAvatars = getAvailableAvatars();

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

  const handleRoomClick = () => {
    setEditRoomId(gameState.roomId);
    setIsEditingRoom(true);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editRoomId.trim()) {
      const capitalizedRoomId = editRoomId.trim().toUpperCase();

      // Update URL with new room and reload
      const url = new URL(window.location.href);
      url.searchParams.set("room", capitalizedRoomId);
      window.history.replaceState({}, "", url.toString());
      window.location.reload();
    }
  };

  const handleRoomCancel = () => {
    setIsEditingRoom(false);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
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
  };

  const handleNameClick = () => {
    // Use playerName from server, or fallback to localStorage if empty
    const nameToUse = playerName || getStoredPlayerName() || "";
    setEditName(nameToUse);
    setIsEditingName(true);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
  };

  const handleAvatarClick = () => {
    const avatarToUse = playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar();
    setEditAvatar(avatarToUse);
    setIsEditingAvatar(true);
  };

  const handleAvatarSubmit = (e: React.FormEvent) => {
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
  };

  const handleAvatarCancel = () => {
    setIsEditingAvatar(false);
  };

  const handleAvatarSelect = (avatar: string) => {
    setEditAvatar(avatar);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-800 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="text-center space-y-8">
        {/* Room ID */}
        <div>
          <p className="text-white/70 text-lg mb-4">Room:</p>
          {isEditingRoom ? (
            <form
              onSubmit={handleRoomSubmit}
              className="w-full max-w-md mx-auto"
            >
              <div className="space-y-4">
                <input
                  ref={roomInputRef}
                  type="text"
                  value={editRoomId}
                  onChange={(e) => setEditRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room code..."
                  className="w-full px-4 py-3 text-lg font-medium text-gray-800 bg-white rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-500 text-center uppercase transition-all duration-300"
                  maxLength={4}
                />

                <button
                  type={editRoomId.trim().toUpperCase() === gameState.roomId ? "button" : "submit"}
                  onClick={editRoomId.trim().toUpperCase() === gameState.roomId ? handleRoomCancel : undefined}
                  disabled={!editRoomId.trim()}
                  className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm text-lg hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {editRoomId.trim().toUpperCase() === gameState.roomId ? "Cancel" : "Join Room"}
                </button>
              </div>
            </form>
          ) : (
            <div
              onClick={handleRoomClick}
              className="cursor-pointer hover:bg-white/10 rounded-xl px-6 py-4 transition-all duration-300 bg-white/20 backdrop-blur-sm hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <span className="text-4xl md:text-6xl font-mono font-bold text-white tracking-wider">
                {gameState.roomId}
              </span>
            </div>
          )}
        </div>

        {/* Player Name */}
        <div>
          <p className="text-white/70 text-lg mb-4">Name:</p>

          {isEditingName ? (
            <form
              onSubmit={handleNameSubmit}
              className="w-full max-w-md mx-auto"
            >
              <div className="space-y-4">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.toUpperCase())}
                  placeholder="Your name here..."
                  className="w-full px-4 py-3 text-lg font-medium text-gray-800 bg-white rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-500 text-center uppercase transition-all duration-300"
                  maxLength={20}
                />

                <button
                  type={editName.trim().toUpperCase() === (playerName || getStoredPlayerName() || "").toUpperCase() ? "button" : "submit"}
                  onClick={editName.trim().toUpperCase() === (playerName || getStoredPlayerName() || "").toUpperCase() ? handleNameCancel : undefined}
                  disabled={!editName.trim()}
                  className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm text-lg hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {editName.trim().toUpperCase() === (playerName || getStoredPlayerName() || "").toUpperCase() ? "Cancel" : "Save Name"}
                </button>
              </div>
            </form>
          ) : (
            <div
              onClick={handleNameClick}
              className="cursor-pointer hover:bg-white/10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <span className="text-4xl md:text-6xl font-bold text-white">
                {playerName}
              </span>
            </div>
          )}
        </div>

        {/* Player Avatar */}
        <div>
          <p className="text-white/70 text-lg mb-4">Avatar:</p>

          {isEditingAvatar ? (
            <form
              onSubmit={handleAvatarSubmit}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="space-y-4">
                {/* Current Avatar Preview */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <img
                      src={generateAvatarUrl(editAvatar)}
                      alt="Current avatar"
                      className="w-24 h-24 rounded-lg"
                    />
                  </div>
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto bg-white/10 rounded-xl p-4">
                  {availableAvatars.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                        editAvatar === avatar
                          ? "bg-white/30 ring-2 ring-white/50"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <img
                        src={generateAvatarUrl(avatar)}
                        alt={avatar}
                        className="w-12 h-12 rounded"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type={editAvatar === (playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar()) ? "button" : "submit"}
                  onClick={editAvatar === (playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar()) ? handleAvatarCancel : undefined}
                  disabled={!editAvatar}
                  className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm text-lg hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {editAvatar === (playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar()) ? "Cancel" : "Save Avatar"}
                </button>
              </div>
            </form>
          ) : (
            <div
              onClick={handleAvatarClick}
              className="cursor-pointer hover:bg-white/10 rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
                <img
                  src={generateAvatarUrl(playerAvatar || getStoredPlayerAvatar() || getPlayerAvatar())}
                  alt="Player avatar"
                  className="w-24 h-24 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
