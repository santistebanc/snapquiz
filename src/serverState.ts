import { store } from "./machine"
import { questions } from "./questions"
import type { ServerState } from "./types"

export const initialState: ServerState = {
    roomId: "",
    rounds: [],
    currentRound: 0,
    players: {},
    questions: questions,
    phase: "lobby",
    connections: {},
}

export const serverState = store<ServerState>(initialState)