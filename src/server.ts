import type * as Party from "partykit/server";
import type { R2Bucket } from "@cloudflare/workers-types";
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
  audioBucket: R2Bucket | null = null;

  constructor(readonly room: Party.Room, readonly ctx?: Party.ExecutionContext) {
    // Access R2 bucket from environment
    // In PartyKit, R2 buckets are bound at deployment time and available via env
    // The bucket binding name should match what's configured in PartyKit deployment
    try {
      const env = (ctx as any)?.env || (room as any).env || {};
      if (env.AUDIO_BUCKET) {
        this.audioBucket = env.AUDIO_BUCKET as R2Bucket;
        console.log('[Server] R2 bucket initialized');
      } else {
        console.warn('[Server] R2 bucket not available - audio will use data URLs');
        console.warn('[Server] To enable R2: Configure R2 bucket binding when deploying with PartyKit');
      }
    } catch (error) {
      console.warn('[Server] Error accessing R2 bucket:', error);
      console.warn('[Server] Audio will use data URLs as fallback');
    }

    this.gameState.roomId = room.id;
    this.router = (router as any).call(this, routes, "lobby", () => { this.gameState.phase = this.router.state })

          // Ensure settings exist for backward compatibility
          if (!this.gameState.settings) {
            this.gameState.settings = { language: 'American', voiceId: 'Daniel', ttsProvider: 'unrealspeech' };
          }
          // Migrate old settings without language
          if (this.gameState.settings && !this.gameState.settings.language) {
            this.gameState.settings.language = 'American';
          }
          // Migrate old settings without ttsProvider
          if (this.gameState.settings && !this.gameState.settings.ttsProvider) {
            this.gameState.settings.ttsProvider = 'unrealspeech';
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
        const audioFileEntry = formData.get('file');
        const language = (formData.get('language') as string) || 'en';
        const prompt = (formData.get('prompt') as string) || undefined;
        
        if (!audioFileEntry || typeof audioFileEntry === 'string') {
          return new Response(JSON.stringify({ error: "No audio file provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        
        const audioFile = audioFileEntry as File;
        
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
        
        // Build provider options with optional prompt
        const providerOptions: { openai: { language: string; prompt?: string } } = {
          openai: {
            language: language
          }
        };
        
        if (prompt) {
          providerOptions.openai.prompt = prompt;
        }
        
        const result = await experimental_transcribe({
          model: openai.transcription('whisper-1'),
          audio: audioData,
          providerOptions: providerOptions,
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
        const ttsProvider = this.gameState.settings?.ttsProvider || 'unrealspeech';
        console.log(`Test voice: generating with provider ${ttsProvider} for voice ${voiceId}`);
        try {
          const { audioUrl } = await generateAudioWithTimestamps(testPhrase, voiceId, ttsProvider);
          console.log(`Test voice: generated audio URL length ${audioUrl?.length || 0}`);
          if (!audioUrl) {
            return new Response(JSON.stringify({ error: "Failed to generate audio URL" }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ audioUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (error) {
          console.error('Test voice error:', error);
          return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
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
      // Get a snapshot of questions to avoid reactive proxy issues
      const questionsSnapshot = Array.from(this.gameState.questions);
      
      // Store questions with audioUrl - R2 URLs are small strings, not large base64 data
      // If audioUrl is a data URL (base64), exclude it to avoid KV size limits
      // Fully serialize to JSON and back to ensure completely plain objects
      const questionsToStore = questionsSnapshot.map((question) => {
        // Create a plain object with only serializable properties
        const plainQuestion: any = {
          id: String(question.id || ''),
          text: String(question.text || ''),
          category: String(question.category || ''),
          answer: String(question.answer || ''),
          options: Array.isArray(question.options) ? question.options.map(opt => String(opt)) : [],
          revealedQuestion: Boolean(question.revealedQuestion),
          openOptions: Boolean(question.openOptions),
        };
        
        // Only include language if present
        if (question.language) {
          plainQuestion.language = String(question.language);
        }
        
        // Only include audioUrl if it's not a data URL (data URLs are too large)
        if (question.audioUrl && !question.audioUrl.startsWith('data:')) {
          plainQuestion.audioUrl = String(question.audioUrl);
        }
        
        // Include wordTimestamps if present (ensure they're plain objects)
        if (question.wordTimestamps && Array.isArray(question.wordTimestamps) && question.wordTimestamps.length > 0) {
          plainQuestion.wordTimestamps = question.wordTimestamps.map(ts => ({
            word: String(ts.word || ''),
            start: Number(ts.start || 0),
            end: Number(ts.end || 0),
          }));
        }
        
        return plainQuestion;
      });

      // Double-serialize to ensure completely plain objects (handles any nested reactive properties)
      const jsonString = JSON.stringify(questionsToStore);
      const fullySerialized = JSON.parse(jsonString);
      
      await this.room.storage.put("questions", fullySerialized);
    } catch (error) {
      console.error("Failed to save questions to storage:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
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