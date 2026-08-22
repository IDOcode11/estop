import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";

interface ScoringScreenProps{
    room: Room<RoomStateShape>;
}

const POINT_OPTIONS = [0, 5, 10];

export default function ScoringScreen({ room }: ScoringScreenProps) {
    const state = useGameState(room);

    if (!state || !state.currentPrompts || !state.players || !state.submissions) 
      return null;

    const isLeader = room.sessionId === state.leaderId;
    const prompt = state.currentPrompts[state.currentPromptIndex];
    const playerEntries = [...state.players.entries()];

    const awardPoints = (toPlayerId: string, points: number) =>{
        room.send("awardPoints", { toPlayerId, points });
    };

    const nextPromptToScore = () =>{
        room.send("continueScoring");
    };

    return(
        <div className="min-h-screen bg-gray-200 flex flex-col items-center p-6 gap-6">
            <div className="w-16 h-16 rounded-full bg-green-400 flex items-center justify-center font-bold text-gray-800 text-xl">
                {state.currentLetter}
            </div>
            <div className="w-full max-w-2xl bg-orange-300 rounded-lg p-4 flex flex-col gap-3">
                <div className="bg-yellow-100 rounded-lg px-4 py-2 font-bold text-gray-800 self-center-safe">
                    {prompt.subject}
                </div>
                <div className="bg-cyan-400 rounded-lg p-3 flex flex-col gap-2">
                    {playerEntries.map( ([sessionId, player]) =>{
                        const submission = state.submissions.get(sessionId);
                        const answer = submission?.answers[state.currentPromptIndex] ?? "";
                        const currentPoints = state.pointsInProgress.get(sessionId) ?? 0;

                        return (
                            <div key={sessionId} className="flex items-center gap-3">
                                <div className="bg-green-700 text-white rounded-lg px-3 py-2 font-semibold">
                                    {player.name}
                                </div>
                                <div className="flex-1 bg-green-200 rounded-lg px-3 py-2">
                                    {answer}
                                </div>
                                {isLeader ? (
                                    <select
                                        value={currentPoints}
                                        onChange={(e) => awardPoints(sessionId, Number(e.target.value))}
                                        className="bg-white rounded-lg px-2 py-2 font-bold text-gray-800">
                                        {POINT_OPTIONS.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="bg-gray-100 rounded-lg px-3 py-2 font-bold text-gray-800">
                                        {currentPoints}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {isLeader && (
                <button
                    onClick={nextPromptToScore}
                    className="bg-red-400 px-6 py-3 rounded-lg font-bold text-gray-800">
                    Next
                </button>
            )}
        </div>
    );
}