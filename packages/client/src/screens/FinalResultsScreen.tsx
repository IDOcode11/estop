import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";

interface FinalResultsScreenProps{
    room: Room<RoomStateShape>;
}

export default function FinalResultsScreen({ room }: FinalResultsScreenProps){
    const state = useGameState(room);

    if (!state || !state.players) 
      return null;

    const isLeader = room.sessionId === state.leaderId;
    const playerEntries = [...state.players.entries()].sort( (a, b) => b[1].totalScore - a[1].totalScore);

    const topScore = playerEntries[0][1].totalScore;
    const winners = playerEntries.filter(([, player]) => player.totalScore === topScore);
    const rest = playerEntries.filter(([, player]) => player.totalScore !== topScore);
    const isTie = winners.length > 1;

    return (
        <div className="min-h-screen flex flex-col items-center p-6 gap-6">
            <div className="w-full max-w-md bg-sunset border-4 border-ink rounded-lg p-4 flex flex-col items-center gap-3">
                <div className="font-display font-bold text-ink text-sm uppercase tracking-wide">
                    {isTie ? "Winners" : "Winner"}
                </div>
                {winners.map(([sessionId, player]) =>(
                    <div
                        key={sessionId}
                        className={`flex flex-col items-center gap-1 ${sessionId === room.sessionId ? "ring-4 ring-mint rounded-lg p-2" : ""}`}>
                        <div className="font-display font-bold text-ink text-xl">
                            {player.name}
                        </div>
                    </div>
                ))}
                <div className="bg-white border-2 border-ink rounded-lg px-6 py-2 font-display font-bold text-ink">
                    {topScore}
                </div>
            </div>
            <div className="w-full max-w-md flex flex-col gap-2">
                {rest.map(([sessionId, player]) => (
                    <div 
                        key={sessionId} 
                        className="flex items-center gap-3">
                        <div className={`flex-1 bg-ink ${sessionId === room.sessionId ? "text-mint" : "text-paper"} border-2 border-ink rounded-lg px-4 py-2 font-semibold`}>
                            {player.name}
                        </div>
                        <div className="bg-sky/30 border-2 border-ink rounded-lg px-4 py-2 font-display font-bold text-ink w-24 text-center">
                            {player.totalScore}
                        </div>
                    </div>
                ))}
            </div>
            {isLeader && (
                <button
                    onClick={() => room.send("returnToLobby")}
                    className="bg-sky border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                    Return to Lobby
                </button>
            )}
        </div>
    );
}