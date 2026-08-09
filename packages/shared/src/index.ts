export type GamePhase = 
    | "lobby"
    | "randomize"
    | "prompt"
    | "scoring"
    | "results";

export interface PromptData {
    id: string;
    subject: string;
    text: string;
}