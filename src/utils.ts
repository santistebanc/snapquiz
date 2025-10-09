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
  const playerUrl = `${window.location.origin}?roomId=${roomId}`;

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

// Parse URL parameters
export function getUrlParams(): { name?: string; roomId?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    name: urlParams.get("name") || undefined,
    roomId: urlParams.get("roomId") || undefined,
  };
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

// Connection ID utilities
export function getStoredConnectionId(): string | null {
  return localStorage.getItem("snapquiz_connectionId");
}

export function setStoredConnectionId(connectionId: string): void {
  localStorage.setItem("snapquiz_connectionId", connectionId);
}

// Get room ID with fallback to localStorage
export function getRoomId(): string {
  const urlParams = getUrlParams();
  const storedRoomId = getStoredRoomId();

  if (urlParams.roomId) {
    // URL param takes precedence, update localStorage
    const capitalizedRoomId = urlParams.roomId.toUpperCase();
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

