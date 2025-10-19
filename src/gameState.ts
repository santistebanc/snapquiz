import { store } from "./machine"
import type { GameState } from "./types"

export const initialState: GameState = {
    roomId: "",
    rounds: [],
    currentRound: 0,
    players: {},
    questions: [],
    phase: "lobby",
    connections: {},
}

export const gameState = store<GameState>(initialState)