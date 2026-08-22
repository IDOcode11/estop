import { GamePhase } from "./index";

//This file mirror the same layout as RoomState on the server side
export interface PlayerState {
  name: string;
  totalScore: number;
  roundScore: number;
  connected: boolean;
}

export interface PromptState {
  id: string;
  subject: string;
}

export interface SubmissionState {
  answers: string[];
}

export interface RoomStateShape {
  phase: GamePhase;
  leaderId: string;
  roomCode: string;

  currentLetter: string;
  usedLetters: string[];

  currentPrompts: PromptState[];
  currentPromptIndex: number;

  currentRound: number;
  totalRounds: number;
  answerTimeSeconds: number;
  timerEndsAt: number;

  players: Map<string, PlayerState>;
  submissions: Map<string, SubmissionState>;
  pointsInProgress: Map<string, number>;
}