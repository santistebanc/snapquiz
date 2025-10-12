export enum Phase {
  LOBBY = 0,
  QUESTIONING = 1,
  SHOWING_OPTIONS = 2,
  REVEALING_ANSWER = 3,
  GIVING_POINTS = 4,
  FINISHED = 5,
  GAME_OVER = 6
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  connectedAt: number;
  points: number;
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

export interface Round {
  questionId: string;
  chosenOptions: Map<string, string> | Record<string, string>;
  revealedWordsIndex: number;
}

export interface GameState {
  roomId: string;
  players: Map<string, Player>;
  questions: Question[];
  phase: Phase;
  rounds: Round[];
  currentRound: number;
}

export interface ServerMessage {
  type: 'update';
  data: any;
}

export interface ClientMessage {
  type: 'joinAsPlayer' | 'joinAsScreen' | 'changeProfile' | 'startGame' | 'resetGame' | 'selectOption';
  data: {
    name?: string;
    avatar?: string;
    connectionId?: string;
    option?: string;
  };
}
