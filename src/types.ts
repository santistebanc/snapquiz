export interface Player {
  id: string;
  name: string;
  connectedAt: number;
}

export interface GameState {
  roomId: string;
  players: Map<string, Player>;
}

export interface ServerMessage {
  type: 'gameStateUpdate';
  data: any;
}

export interface ClientMessage {
  type: 'joinAsPlayer' | 'joinAsScreen' | 'changePlayerName';
  data: {
    name?: string;
    connectionId?: string;
  };
}
