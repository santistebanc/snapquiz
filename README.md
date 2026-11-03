# SnapQuiz - Multiplayer Quiz Game

![SnapQuiz shared screen showing a multiple-choice question with the correct answer highlighted](docs/screenshot.png)

A real-time multiplayer party quiz built with PartyKit, React, and TypeScript. A shared screen hosts the game while players join from their phones by QR code and answer by tapping or speaking.

- **Questions for any category**: the OpenAI API generates five four-option questions per category on demand, in the chosen language, as structured output validated with Zod.
- **Spoken answers**: questions are read aloud with text-to-speech (audio cached in Cloudflare R2), spoken answers are transcribed, and free-text answers are judged leniently by a second model call.
- **Real-time rooms**: avatars, points and admin controls stay in sync over WebSockets through a PartyKit server.

## How to play

SnapQuiz is a trivia game meant for a group of friends or family **in front of a TV**: one shared big screen shows the game, and **each player uses their own phone** to answer. Players can respond by **speaking into the microphone**, **choosing multiple-choice options** shown on their phone, or **typing** an answer—depending on what the round allows.

### Creating the quiz

An **admin** builds the quiz with **AI**. They enter a **topic**, and the AI generates questions on that topic for the session.

### Joining the game

The TV shows a **QR code**. Players scan it with their phones to join the same room before or as the game starts.

### Each question (round flow)

The game moves **question by question**:

1. **Buzz in early:** If someone thinks they know the answer right away, they press the **buzzer** on their phone. They may then give the answer **on the mic** or **by typing** it. **AI checks** whether the answer is correct.
2. **Wrong buzz:** If that answer is **wrong**, that player **loses points**, and the question **continues** for everyone else.
3. **Other paths:** Remaining players can **buzz** again, or wait until **multiple-choice options** appear on the TV and on their phones. Each player selects the option they believe is correct on their device.
4. **Reveal and scoring:** The **correct answer is revealed**, **points are awarded** to everyone who answered correctly for that question, and the game advances to the **next round**.

### End of the game

After **all questions** have been played, the **winner**—the player with the **highest score**—is announced.

## Development

### Environment Variables

Before running the application, you need to set up your environment variables:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your OpenAI API key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

3. **Update your `.env` file:**
   ```bash
   # Replace the placeholder with your actual API key
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

4. **Deploy with environment variables:**
   ```bash
   # Deploy to PartyKit with your environment variables
   npx partykit deploy --with-vars
   ```

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
