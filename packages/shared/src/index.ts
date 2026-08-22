export * from "./types";

export type GamePhase = 
    | "lobby"
    | "randomize"
    | "prompt"
    | "scoring"
    | "results"
    | "finalResults";

export interface PromptData {
    id: string;
    subject: string;
}