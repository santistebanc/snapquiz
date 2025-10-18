import type * as Party from "partykit/server";
import { game } from "./logic";
import { serverState } from "./serverState";

export default class RoomServer implements Party.Server {

  constructor(readonly room: Party.Room) {
    // Set the room ID in the game state
    serverState.roomId = room.id;

    serverState.onChange(() => {
      room.broadcast(
        JSON.stringify({
          type: "update",
          data: {
            ...serverState,
          },
        })
      );
    });
  }

  async onConnect(conn: Party.Connection) {
    const sendMessage = (message: string | ArrayBuffer | ArrayBufferView) => {
      conn.send(message);
    };
    game.onConnect(sendMessage);
  }

  async onClose(connection: Party.Connection) {
    game.onClose(connection.id);
  }

  async onMessage(message: string, sender: Party.Connection) {
    game.onMessage(message, sender.id);
  }

}
