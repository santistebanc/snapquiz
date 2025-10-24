import type * as Party from "partykit/server";
import { initialState } from "./gameState";
import { router, store, type Router } from "./machine";
import { routes, type ServerState } from "./logic";
import type { GameState, Player, Question } from "./types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export default class Server implements Party.Server, ServerState {
  connections: Record<string, string> = {};
  gameState = store<GameState>(initialState)
  router: Router<typeof routes>;

  constructor(readonly room: Party.Room) {

    this.gameState.roomId = room.id;
    this.router = (router as any).call(this, routes, "lobby", () => { this.gameState.phase = this.router.state })

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