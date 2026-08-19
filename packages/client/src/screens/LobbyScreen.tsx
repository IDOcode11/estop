import { Room } from "colyseus.js";
import { RoomStateShape } from "../../../shared/src";
import { useGameState } from "../hooks/useGameState";

interface LobbyScreenProps{
    room: Room<RoomStateShape>;
}

export default function LobbyScreen( {room}: LobbyScreenProps){
    const state = useGameState(room);
    if (!state || !state.players)
      return null;

    const isLeader = room.sessionId === state.leaderId;
    const leader = state.players.get(state.leaderId);
    const allPlayerEntries = [...state.players.entries()];
    const guestPlayerEntries = allPlayerEntries.filter(([sessionId]) => sessionId !== state.leaderId);

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center gap-6 p-6">
            <div className="w-full max-w-2xl bg-red-400 text-center py-3 rounded-lg font-bold text-gray-800">
                Room ID: {state.roomCode}
            </div>
            <div className="bg-yellow-300 px-6 py-2 rounded-lg font-bold text-gray-800">
                Host: {leader?.name ?? "..."}
            </div>
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                {guestPlayerEntries.map(([sessionId, player]) => (
                    <div key={sessionId} className="bg-yellow-300 rounded-lg px-4 py-3 text-center font-semibold text-gray-800">
                        {player.name}
                    </div>
                ))}
            </div>
            <div className="w-full max-w-2xl bg-cyan-400 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-center">
                <label className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-gray-800"># of Rounds</span>
                    <input
                        type="number"
                        min={1}
                        max={26}
                        value={state.totalRounds}
                        disabled={!isLeader}
                        onChange={(e) => room.send("updateSettings", { totalRounds: Number(e.target.value) })}
                        className="w-24 text-center rounded p-2 disabled:opacity-60"
                    />
                </label>

                <label className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-gray-800"># for Timer</span>
                    <input
                        type="number"
                        min={15}
                        max={150}
                        value={state.answerTimeSeconds}
                        disabled={!isLeader}
                        onChange={(e) => room.send("updateSettings", { answerTimeSeconds: Number(e.target.value) })}
                        className="w-24 text-center rounded p-2 disabled:opacity-60"
                    />
                </label>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => room.leave()}
                    className="bg-purple-400 px-6 py-3 rounded-lg font-bold text-gray-800">
                    Leave
                </button>
                {isLeader && (
                <button
                    onClick={() => room.send("startGame")}
                    className="bg-blue-400 px-6 py-3 rounded-lg font-bold text-gray-800">
                    Start Game
                </button>)}
            </div>
        </div>
    );
}