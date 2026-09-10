import { useState, useEffect, useRef } from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";
import RoomCodeBadge from "../components/RoomCodeBadge";

interface LobbyScreenProps{
    room: Room<RoomStateShape>;
    onLeave: () => void;
}

export default function LobbyScreen( {room, onLeave}: LobbyScreenProps){
    const state = useGameState(room);
    const [roundsText, setRoundsText] = useState("");
    const [timerText, setTimerText] = useState("");
    const roundsFocused = useRef(false);
    const timerFocused = useRef(false);

    useEffect(() =>{
        if (!roundsFocused.current) 
          setRoundsText(String(state?.totalRounds));
    }, [state?.totalRounds]);

    useEffect(() =>{
        if (!timerFocused.current) 
          setTimerText(String(state?.answerTimeSeconds));
    }, [state?.answerTimeSeconds]);

    if (!state || !state.players)
      return null;

    const isLeader = room.sessionId === state.leaderId;
    const leader = state.players.get(state.leaderId);
    const allPlayerEntries = [...state.players.entries()];
    const guestPlayerEntries = allPlayerEntries.filter(([sessionId]) => sessionId !== state.leaderId);

    return (
        <div className="min-h-screen flex flex-col items-center gap-6 p-6 pt-16">
            <RoomCodeBadge code={state.roomCode}/>
            <div className={`bg-white border-2 border-ink rounded-lg px-6 py-2 font-display font-bold ${isLeader ? "text-mint" : "text-ink"}`}>
                Host: {leader?.name ?? "..."}
            </div>
            <div className="w-full max-w-2xl flex justify-center">
                {guestPlayerEntries.map(([sessionId, player]) => (
                    <div key={sessionId} className={`bg-white border-2 border-ink rounded-lg px-4 py-3 text-center font-semibold  ${sessionId === room.sessionId ? "text-mint" : "text-ink"}`} >
                        {player.name}
                    </div>
                ))}
            </div>
            <div className="w-full max-w-2xl bg-sky/20 border-2 border-ink rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-center">
                <label className="flex flex-col items-center gap-1">
                    <span className="font-display font-bold text-ink text-sm"># of Rounds</span>
                    <input
                        type="number"
                        value={roundsText}
                        disabled={!isLeader}
                        onFocus={() => (roundsFocused.current = true) }
                        onBlur={() =>{
                            roundsFocused.current = false;
                            setRoundsText(String(state.totalRounds));
                        }}
                        onChange={(e) =>{
                            setRoundsText(e.target.value);
                            const parsed = Number(e.target.value);
                            if (e.target.value !== "" && !Number.isNaN(parsed)){
                              room.send("updateSettings", { totalRounds: parsed });
                            }
                        }}
                        className="w-24 text-center border-2 border-ink rounded p-2 bg-white text-ink disabled:opacity-60"
                    />
                </label>

                <label className="flex flex-col items-center gap-1">
                    <span className="font-display font-bold text-ink text-sm"># for Timer</span>
                    <input
                        type="number"
                        value={timerText}
                        disabled={!isLeader}
                        onFocus={() => (timerFocused.current = true) }
                        onBlur={() =>{
                            timerFocused.current = false;
                            setTimerText(String(state.answerTimeSeconds));
                        }}
                        onChange={(e) =>{
                            setTimerText(e.target.value);
                            const parsed = Number(e.target.value);
                            if (e.target.value !== "" && !Number.isNaN(parsed)){
                              room.send("updateSettings", { answerTimeSeconds: parsed });
                            }
                        }}
                        className="w-24 text-center border-2 border-ink rounded p-2 bg-white text-ink disabled:opacity-60"
                    />
                </label>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={onLeave}
                    className="bg-coral border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                    Leave
                </button>
                {isLeader && (
                <button
                    onClick={() => room.send("startGame")}
                    className="bg-sunset border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink">
                    Start Game
                </button>)}
            </div>
        </div>
    );
}