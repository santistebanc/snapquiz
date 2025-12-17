import type * as Party from "partykit/server";
import { initialState } from "./gameState";
import { router, store, type Router } from "./machine";
import { routes, type ServerState } from "./logic";
import type { GameState, Player, Question } from "./types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, experimental_transcribe } from "ai";
import { z } from "zod";

export default class Server implements Party.Server, ServerState {
  connections: Record<string, string> = {};
  gameState = store<GameState>(initialState)
  router: Router<typeof routes>;

  constructor(readonly room: Party.Room) {

    this.gameState.roomId = room.id;
    this.router = (router as any).call(this, routes, "lobby", () => { this.gameState.phase = this.router.state })

    // Ensure settings exist for backward compatibility
    if (!this.gameState.settings) {
      this.gameState.settings = { language: 'American', voiceId: 'Daniel' };
    }
    // Migrate old settings without language
    if (this.gameState.settings && !this.gameState.settings.language) {
      this.gameState.settings.language = 'American';
    }

    // Load questions from storage on room initialization
    this.loadQuestionsFromStorage();

    this.gameState.onChange(() => {
      room.broadcast(
        JSON.stringify({
          type: "update",
          data: {
            ...this.gameState,
          },
        })
      );
      this.saveQuestionsToStorage();
    });
  }

  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/suggest-category")) {
      const q = (url.searchParams.get("q") || "").slice(0, 40);
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ suggestions: [] }), { status: 200, headers: { "Content-Type": "application/json" } });

        const openai = createOpenAI({ apiKey });
        const schema = z.object({ suggestions: z.array(z.string().min(1)).max(8) });
        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          schema,
          prompt:
            `You autocomplete a single quiz category. Given a partial input, return up to 8 short category suggestions (1-3 words each) as JSON {"suggestions": string[]}. ` +
            `Prioritize items that start with the partial, else closely related common quiz categories. ` +
            `Partial: "${q}"`,
          temperature: 0.2,
        });
        let suggestions = (object?.suggestions ?? []) as string[];
        suggestions = suggestions.map((s) => s.trim()).filter(Boolean).slice(0, 8);
        return new Response(JSON.stringify({ suggestions }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ suggestions: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname.endsWith("/transcribe")) {
      try {
        const formData = await req.formData();
        const audioFile = formData.get('file') as File;
        const language = (formData.get('language') as string) || 'en';
        
        if (!audioFile) {
          return new Response(JSON.stringify({ error: "No audio file provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        
        // Check if file is too small (likely empty or invalid)
        if (audioFile.size < 1024) {
          return new Response(JSON.stringify({ error: "Audio file too small or empty" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // Convert File to ArrayBuffer, then to Uint8Array for AI SDK
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);

        // Use AI SDK's experimental_transcribe function
        const openai = createOpenAI({ apiKey });
        
        const result = await experimental_transcribe({
          model: openai.transcription('whisper-1'),
          audio: audioData,
          providerOptions: { 
            openai: { 
              language: language 
            } 
          },
        });

        return new Response(JSON.stringify({ text: result.text }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        console.error("Error transcribing audio:", err);
        return new Response(JSON.stringify({ error: `Failed to transcribe audio: ${err}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname.endsWith("/test-voice")) {
      const voiceId = url.searchParams.get("voiceId");
      if (!voiceId) {
        return new Response(JSON.stringify({ error: "voiceId parameter required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      try {
        const { generateAudioWithTimestamps } = await import('./utils/generateAudio');
        
        // Map voices to their languages and test phrases
        const voiceToPhrase: Record<string, string> = {
          // American voices
          'Noah': 'Hello, this is a test of the voice.',
          'Jasper': 'Hello, this is a test of the voice.',
          'Caleb': 'Hello, this is a test of the voice.',
          'Ronan': 'Hello, this is a test of the voice.',
          'Ethan': 'Hello, this is a test of the voice.',
          'Daniel': 'Hello, this is a test of the voice.',
          'Zane': 'Hello, this is a test of the voice.',
          'Autumn': 'Hello, this is a test of the voice.',
          'Melody': 'Hello, this is a test of the voice.',
          'Hannah': 'Hello, this is a test of the voice.',
          'Emily': 'Hello, this is a test of the voice.',
          'Ivy': 'Hello, this is a test of the voice.',
          'Kaitlyn': 'Hello, this is a test of the voice.',
          'Luna': 'Hello, this is a test of the voice.',
          'Willow': 'Hello, this is a test of the voice.',
          'Lauren': 'Hello, this is a test of the voice.',
          'Sierra': 'Hello, this is a test of the voice.',
          // Chinese voices
          'Wei': '你好，这是语音测试。',
          'Jian': '你好，这是语音测试。',
          'Hao': '你好，这是语音测试。',
          'Sheng': '你好，这是语音测试。',
          'Mei': '你好，这是语音测试。',
          'Lian': '你好，这是语音测试。',
          'Ting': '你好，这是语音测试。',
          'Jing': '你好，这是语音测试。',
          // Spanish voices
          'Mateo': 'Hola, esta es una prueba de voz.',
          'Javier': 'Hola, esta es una prueba de voz.',
          'Lucía': 'Hola, esta es una prueba de voz.',
          // French voices
          'Élodie': 'Bonjour, ceci est un test de voix.',
          // Hindi voices
          'Arjun': 'नमस्ते, यह आवाज़ का परीक्षण है।',
          'Rohan': 'नमस्ते, यह आवाज़ का परीक्षण है।',
          'Ananya': 'नमस्ते, यह आवाज़ का परीक्षण है।',
          'Priya': 'नमस्ते, यह आवाज़ का परीक्षण है।',
          // Italian voices
          'Luca': 'Ciao, questo è un test della voce.',
          'Giulia': 'Ciao, questo è un test della voce.',
          // Portuguese voices
          'Thiago': 'Olá, este é um teste de voz.',
          'Rafael': 'Olá, este é um teste de voz.',
          'Camila': 'Olá, este é um teste de voz.',
        };
        
        const testPhrase = voiceToPhrase[voiceId] || 'Hello, this is a test of the voice.';
        const { audioUrl } = await generateAudioWithTimestamps(testPhrase, voiceId);
        return new Response(JSON.stringify({ audioUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        console.error("Error generating test voice:", err);
        return new Response(JSON.stringify({ error: "Failed to generate test audio" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("Not found", { status: 404 });
  }

  private async loadQuestionsFromStorage() {
    try {
      const storedQuestions = await this.room.storage.get<Question[]>("questions");
      if (storedQuestions && Array.isArray(storedQuestions)) {
        this.gameState.questions = storedQuestions;
      }
    } catch (error) {
      console.error("Failed to load questions from storage:", error);
    }
  }

  private async saveQuestionsToStorage() {
    try {
      // Ensure we're storing plain JSON-serializable objects
      const questionsToStore = JSON.parse(JSON.stringify(this.gameState.questions));

      await this.room.storage.put("questions", questionsToStore);
    } catch (error) {
      console.error("Failed to save questions to storage:", error);
    }
  }

  async onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({
      type: "update", data: { ...this.gameState },
    }));
  }

  async onClose(connection: Party.Connection) {
    const playerId = this.connections[connection.id];

    if (playerId) {
      delete this.connections[connection.id];

      const hasOtherConnections = Object.values(this.connections).includes(playerId);
      if (!hasOtherConnections) {
        delete this.gameState.players[playerId];
      }
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    const clientMessage: any = JSON.parse(message);

    if (clientMessage.type === 'action') {
      (this.router as any)[clientMessage.data.action]?.call(this, ...clientMessage.data.args);
    }
  }


}