import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";
import RoomCodeBadge from "../components/RoomCodeBadge";

interface ResultsScreenProps{
    room: Room<RoomStateShape>;
}

export default function ResultsScreen({ room }: ResultsScreenProps){
    const state = useGameState(room);

    if (!state || !state.players) 
      return null;

    const isLeader = room.sessionId === state.leaderId;
    const playerEntries = [...state.players.entries()];
    const isFinalRound = state.currentRound >= state.totalRounds - 1;

    return (
        <div className="min-h-screen flex flex-col items-center p-6 pt-16 gap-6">
            <RoomCodeBadge code={state.roomCode}/>
            <div className="bg-sunset border-2 border-ink rounded-full px-6 py-2 font-display font-bold text-ink">
                Round {state.currentRound + 1}/{state.totalRounds}
            </div>
            <div className="w-full max-w-2xl flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-1 font-display font-bold text-ink text-sm">
                    <div>Players</div>
                    <div className="text-center">Round Score</div>
                    <div className="text-center">Total Score</div>
                </div>
                {playerEntries.map(([sessionId, player]) =>(
                    <div 
                        key={sessionId} 
                        className={`grid grid-cols-[1fr_100px_100px] gap-2 items-center ${sessionId === room.sessionId ? "ring-4 ring-mint rounded-lg" : ""}`}>
                        <div className="bg-ink text-paper border-2 border-ink rounded-lg px-4 py-2 font-semibold truncate">
                            {player.name}
                        </div>
                        <div className="bg-white border-2 border-ink rounded-lg px-4 py-2 font-display font-bold text-ink text-center">
                            {player.roundScore}
                        </div>
                        <div className="bg-sky/30 border-2 border-ink rounded-lg px-4 py-2 font-display font-bold text-ink text-center">
                            {player.totalScore}
                        </div>
                    </div>
                ))}
            </div>
            {isLeader && (
                <div className="flex gap-4">
                    <button
                        onClick={() => room.send("endGame")}
                        className="bg-coral border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                        End Game
                    </button>
                    {!isFinalRound && (
                        <button
                            onClick={() => room.send("continueToNextRound")}
                            className="bg-sky border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                            Next Round
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}