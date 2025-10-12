export enum Phase {
  LOBBY = 0,
  QUESTIONING = 1,
  WAIT_AFTER_QUESTION = 2,
  SHOWING_OPTIONS = 3,
  REVEALING_ANSWER = 4,
  GIVING_POINTS = 5,
  FINISHED = 6,
  GAME_OVER = 7
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
  type: 'update' | 'wordReveal' | 'timerCountdown';
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
