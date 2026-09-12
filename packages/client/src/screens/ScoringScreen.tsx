import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";
import RoomCodeBadge from "../components/RoomCodeBadge";

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
        <div className="min-h-screen flex flex-col items-center gap-6 p-6 ">
            <RoomCodeBadge code={state.roomCode}/>
            <div className="w-16 h-16 rounded-full bg-sunset border-2 border-ink flex items-center justify-center font-display font-bold text-ink text-xl leading-none">
                {state.currentLetter}
            </div>
            <div className="w-full max-w-2xl bg-white border-2 border-ink rounded-lg p-4 flex flex-col gap-3">
                <div className="bg-sky/30 border-2 border-ink rounded-lg px-4 py-2 font-display font-bold text-ink self-center">
                    {prompt.subject}
                </div>
                <div className="grid grid-cols-[1fr_1fr_80px] gap-2 px-1 pb-1 font-display font-bold text-ink text-sm">
                    <div>Players</div>
                    <div>Answer</div>
                    <div className="text-center">Points</div>
                </div>
                {playerEntries.map( ([sessionId, player]) =>{
                    const submission = state.submissions.get(sessionId);
                    const answer = submission?.answers[state.currentPromptIndex] ?? "";
                    const currentPoints = state.pointsInProgress.get(sessionId) ?? 0;

                    return (
                        <div 
                            key={sessionId} 
                            className="grid grid-cols-[1fr_1fr_80px] gap-2 items-start mb-1">
                            <div className={`bg-ink ${sessionId === room.sessionId ? "text-mint" : "text-paper"} border-2 border-ink rounded-lg px-3 py-2 font-semibold truncate`}>
                                {player.name}
                            </div>
                            <div className="bg-white border-2 border-ink rounded-lg px-3 py-2 min-h-10 text-ink wrap-break-word min-w-0">
                                {answer}
                            </div>
                            {isLeader ? (
                                <select
                                    value={currentPoints}
                                    onChange={(e) => awardPoints(sessionId, Number(e.target.value))}
                                    className="bg-white border-2 border-ink rounded-lg px-2 py-2 font-display font-bold text-ink">
                                    {POINT_OPTIONS.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="bg-white border-2 border-ink rounded-lg px-3 py-2 font-display font-bold text-ink text-center">
                                    {currentPoints}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {isLeader && (
                <button
                    onClick={nextPromptToScore}
                    className="bg-sunset border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                    Next
                </button>
            )}
        </div>
    );
}