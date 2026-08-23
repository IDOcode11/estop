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

    const [winnerId, winner] = playerEntries[0];
    const rest = playerEntries.slice(1);

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center p-6 gap-6">
            <div className="w-full max-w-md bg-green-400 rounded-lg p-4 flex flex-col items-center gap-2">
                <div className="font-bold text-gray-800 text-xl">
                    {winner.name}
                </div>
                <div className="bg-sky-400 rounded-lg px-6 py-2 font-bold text-gray-800">
                    {winner.totalScore}
                </div>
            </div>
            <div className="w-full max-w-md flex flex-col gap-2">
                {rest.map(([sessionId, player]) => (
                    <div key={sessionId} className="flex items-center gap-3">
                        <div className={`flex-1 bg-green-400 rounded-lg px-4 py-2 font-semibold text-gray-800 ${sessionId === room.sessionId ? "ring-4 ring-blue-400" : ""}`}>
                            {player.name}
                        </div>
                        <div className="bg-sky-400 rounded-lg px-4 py-2 font-bold text-gray-800 w-24 text-center">
                            {player.totalScore}
                        </div>
                    </div>
                ))}
            </div>
            {isLeader && (
                <button
                    onClick={() => room.send("returnToLobby")}
                    className="bg-blue-400 px-6 py-3 rounded-lg font-bold text-gray-800">
                    Return to Lobby
                </button>
            )}
        </div>
    );
}