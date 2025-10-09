export interface Player {
  id: string;
  name: string;
  avatar: string;
  connectedAt: number;
}

export interface GameState {
  roomId: string;
  players: Map<string, Player>;
}

export interface ServerMessage {
  type: 'update';
  data: any;
}

export interface ClientMessage {
  type: 'joinAsPlayer' | 'joinAsScreen' | 'changePlayerName' | 'changePlayerAvatar';
  data: {
    name?: string;
    avatar?: string;
    connectionId?: string;
  };
}
