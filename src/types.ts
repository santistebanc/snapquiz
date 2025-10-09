export interface Player {
  id: string;
  name: string;
  avatar: string;
  connectedAt: number;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  answer: string;
  options: string[];
  revealedQuestion: boolean;
  openOptions: boolean;
}

export interface GameState {
  roomId: string;
  players: Map<string, Player>;
  questions: Question[];
  gameStatus: 'lobby' | 'inRound' | 'gameOver';
}

export interface ServerMessage {
  type: 'update';
  data: any;
}

export interface ClientMessage {
  type: 'joinAsPlayer' | 'joinAsScreen' | 'changePlayerName' | 'changePlayerAvatar' | 'startGame' | 'resetGame';
  data: {
    name?: string;
    avatar?: string;
    connectionId?: string;
  };
}
