import QRCode from "qrcode";

// Generate a random 4-character alphanumeric room ID
export function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate QR code data URL for player join link
export async function generateQRCode(roomId: string): Promise<string> {
  const playerUrl = `${window.location.origin}?room=${roomId}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(playerUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}


// LocalStorage utilities
export function getStoredRoomId(): string | null {
  return localStorage.getItem("snapquiz_roomId");
}

export function getStoredPlayerName(): string | null {
  return localStorage.getItem("snapquiz_playerName");
}

export function setStoredRoomId(roomId: string): void {
  localStorage.setItem("snapquiz_roomId", roomId.toUpperCase());
}

export function setStoredPlayerName(playerName: string): void {
  localStorage.setItem("snapquiz_playerName", playerName.toUpperCase());
}

export function getStoredPlayerAvatar(): string | null {
  return localStorage.getItem("snapquiz_playerAvatar");
}

export function setStoredPlayerAvatar(avatar: string): void {
  localStorage.setItem("snapquiz_playerAvatar", avatar);
}

// Connection ID utilities
export function getStoredConnectionId(): string | null {
  return localStorage.getItem("snapquiz_connectionId");
}

export function setStoredConnectionId(connectionId: string): void {
  localStorage.setItem("snapquiz_connectionId", connectionId);
}

// Get room ID with fallback to localStorage
export function getRoomId(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room");
  const storedRoomId = getStoredRoomId();

  if (roomId) {
    // URL param takes precedence, update localStorage
    const capitalizedRoomId = roomId.toUpperCase();
    setStoredRoomId(capitalizedRoomId);
    return capitalizedRoomId;
  }

  if (storedRoomId) {
    return storedRoomId;
  }

  // Generate new room ID and store it
  const newRoomId = generateRoomId();
  setStoredRoomId(newRoomId);
  return newRoomId;
}

// Get player name from localStorage only
export function getPlayerName(): string {
  const storedPlayerName = getStoredPlayerName();

  if (storedPlayerName) {
    return storedPlayerName;
  }

  // Return empty string if no name is provided
  return "";
}

// Avatar utilities
export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
}

export function getAvailableAvatars(): string[] {
  // Return a curated list of fun bottts avatar seeds
  return [
    'robot-1', 'robot-2', 'robot-3', 'robot-4', 'robot-5',
    'bot-1', 'bot-2', 'bot-3', 'bot-4', 'bot-5',
    'android-1', 'android-2', 'android-3', 'android-4', 'android-5',
    'cyber-1', 'cyber-2', 'cyber-3', 'cyber-4', 'cyber-5',
    'tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5',
    'ai-1', 'ai-2', 'ai-3', 'ai-4', 'ai-5',
    'digital-1', 'digital-2', 'digital-3', 'digital-4', 'digital-5',
    'neon-1', 'neon-2', 'neon-3', 'neon-4', 'neon-5',
    'matrix-1', 'matrix-2', 'matrix-3', 'matrix-4', 'matrix-5',
    'future-1', 'future-2', 'future-3', 'future-4', 'future-5'
  ];
}

export function getPlayerAvatar(): string {
  const storedAvatar = getStoredPlayerAvatar();
  if (storedAvatar) {
    return storedAvatar;
  }
  
  // Randomly select an avatar if none is stored
  const availableAvatars = getAvailableAvatars();
  const randomIndex = Math.floor(Math.random() * availableAvatars.length);
  const randomAvatar = availableAvatars[randomIndex];
  
  // Store the randomly selected avatar so it persists
  setStoredPlayerAvatar(randomAvatar);
  
  return randomAvatar;
}

