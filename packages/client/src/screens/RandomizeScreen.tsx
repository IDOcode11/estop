import { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";

interface RandomizeScreenProps{
    room: Room<RoomStateShape>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SPIN_DURATION_MS = 2000;
const SPIN_INTERVAL_MS = 80;

export default function RandomizeScreen( {room}: RandomizeScreenProps){
    const state = useGameState(room);
    const [displayLetter, setDisplayLetter] = useState("_");
    const [landed, setLanded] = useState(false);

    useEffect(() => {
        if (!state?.currentLetter)
          return;

        setLanded(false);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= SPIN_DURATION_MS){
                setDisplayLetter(state.currentLetter);
                setLanded(true);
                clearInterval(interval);
                return;
            }
            
            setDisplayLetter(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
        }, SPIN_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [state?.currentLetter]);

    if (!state)
      return null;

    const isLeader = room.sessionId === state.leaderId;

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center gap-8 p-6">
            <div className="w-40 h-40 rounded-full bg-green-400 flex items-center justify-center font-bold text-gray-800 text-4xl">
                {displayLetter}
            </div>
            {isLeader && landed && (
                <button
                    onClick={() => room.send("revealPrompt")}
                    className="bg-sky-400 px-8 py-3 rounded-lg font-bold text-gray-800">
                    Begin
                </button>
            )}
        </div>
    );
}