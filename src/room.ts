import type * as Party from "partykit/server";
import { initialState } from "./gameState";
import { router, store, type Router } from "./machine";
import { routes, type ServerState } from "./logic";
import type { GameState, Player, Question } from "./types";

export default class RoomServer implements Party.Server, ServerState {
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