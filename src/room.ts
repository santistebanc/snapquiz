import type * as Party from "partykit/server";
import { app } from "./logic";
import { gameState } from "./gameState";

export default class RoomServer implements Party.Server {

  constructor(readonly room: Party.Room) {
    // Set the room ID in the game state
    gameState.roomId = room.id;

    gameState.onChange(() => {
      room.broadcast(
        JSON.stringify({
          type: "update",
          data: {
            ...gameState,
          },
        })
      );
    });
  }

  async onConnect(conn: Party.Connection) {
    const sendMessage = (message: string | ArrayBuffer | ArrayBufferView) => {
      conn.send(message);
    };
    app.onConnect(sendMessage);
  }

  async onClose(connection: Party.Connection) {
    app.onClose(connection.id);
  }

  async onMessage(message: string, sender: Party.Connection) {
    app.onMessage(message, sender.id);
  }

}
