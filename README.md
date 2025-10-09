# SnapQuiz - Multiplayer Quiz Game

A real-time multiplayer quiz game built with PartyKit, React, and TypeScript.

## Development

### Port Configuration

The app uses the `VITE_PARTYKIT_PORT` environment variable to configure both the PartyKit server and client port.

**Default behavior:**
- Server runs on port `37011`
- Client connects to `localhost:37011`

**Custom port:**
```bash
# Set environment variable
export VITE_PARTYKIT_PORT=1999

# Start development server
npm run dev
```

The server will start on port `1999` and the client will automatically connect to the same port.

### Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run deploy` - Deploy to PartyKit
- `npm run build:css` - Build Tailwind CSS

## Features

- **Screen Mode**: Main game display with QR code for players to join
- **Player Mode**: Mobile-friendly interface for players
- **Real-time**: WebSocket-based real-time communication
- **Persistent**: Player names and room IDs saved in localStorage
- **Responsive**: Works on desktop and mobile devices
