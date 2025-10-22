export interface Player {
  id: string;
  name: string;
  avatar: string;
  connectedAt: number;
  points: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  answer: string;
  options: string[];
  revealedQuestion: boolean;
  openOptions: boolean;
  audioUrl?: string;
  wordTimestamps?: WordTimestamp[];
}

export interface Round {
  questionId: string;
  playerAnswers: Record<string, string>;
  revealedWordsIndex: number;
  shuffledOptions: string[];
  buzzedPlayerId: string | null;
  evaluationResult: 'correct' | 'wrong' | null;
  pointsAwarded: Record<string, number>;
}

export interface GameState {
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
