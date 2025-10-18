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
  chosenOptions: Record<string, string>;
  revealedWordsIndex: number;
}

export interface ServerState {
  roomId: string;
  players: Record<string, Player>;
  questions: Question[];
  phase: string;
  rounds: Round[];
  currentRound: number;
  connections: Record<string, string>;
}

export interface ServerMessage {
  type: 'update';
  data: any;
}

export interface ClientMessage {
  type: 'action'
  data: {
    action: string;
    args: any[];
  };
}
