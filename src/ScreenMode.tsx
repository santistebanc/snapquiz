import React, { useState, useEffect } from "react";
import { useGameStore } from "./store";
import { generateQRCode, generateAvatarUrl } from "./utils";
import type { Player } from "./types";

export default function ScreenMode() {
  const { gameState } = useGameStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode(gameState.roomId).then(setQrCodeDataUrl);
  }, [gameState.roomId]);


  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex flex-col items-center justify-between p-4 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
          SnapQuiz
        </h1>
        <div className="w-16 h-1 bg-white mx-auto rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Left Column - Room ID and QR Code */}
          <div className="flex flex-col items-center space-y-4">
            {/* Room ID */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Room Code</h2>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <span className="text-3xl md:text-4xl font-mono font-bold text-white tracking-wider">
                  {gameState.roomId}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Scan to Join</h3>
              {qrCodeDataUrl ? (
                <div className="bg-white p-3 rounded-xl shadow-2xl">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code to join game"
                    className="w-48 h-48"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-white/20 rounded-xl flex items-center justify-center">
                  <div className="text-white text-sm">Generating QR Code...</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Player List */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-3 text-center">
              Players ({gameState.players.size})
            </h3>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 min-h-0">
              {gameState.players.size === 0 ? (
                <div className="text-white/70 text-center py-6">
                  No players joined yet
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from(gameState.players.values()).map((player: Player) => (
                    <div
                      key={player.id}
                      className="bg-white/20 rounded-lg px-3 py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <img
                          src={generateAvatarUrl(player.avatar || 'robot-1')}
                          alt={`${player.name} avatar`}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <span className="text-white font-medium text-sm truncate">
                          {player.name}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 ml-2"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
