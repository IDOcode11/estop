import { useState, useEffect, useRef } from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";
import RoomCodeBadge from "../components/RoomCodeBadge";

interface RandomizeScreenProps{
    room: Room<RoomStateShape>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CELL_SIZE = 160;
const REEL_LENGTH = 24;
const SPIN_DURATION_MS = 2200;

function buildReel(targetLetter: string): string[]{
    const reel: string[] = [];
    for (let i = 0; i < REEL_LENGTH - 1; i++){
        reel.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
    }

    reel.push(targetLetter);
    return reel;
}

export default function RandomizeScreen( {room}: RandomizeScreenProps){
    const state = useGameState(room);
    const [reel, setReel] = useState<string[]>([]);
    const [offset, setOffset] = useState(0);
    const [landed, setLanded] = useState(false);
    const animatingRef = useRef(false);


    useEffect(() => {
        if (!state?.currentLetter)
          return;

        const newReel = buildReel(state.currentLetter);
        setReel(newReel);
        setOffset(0);
        setLanded(false);
        animatingRef.current = true;

        const raf = requestAnimationFrame(() =>{
            requestAnimationFrame(() =>{
                setOffset(-(newReel.length - 1) * CELL_SIZE);
            });    
        });

        return () => cancelAnimationFrame(raf);
    }, [state?.currentLetter]);

    if (!state)
      return null;

    const isLeader = room.sessionId === state.leaderId;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 pt-16">
            <RoomCodeBadge code={state.roomCode}/>
            <div className="flex flex-col items-center gap-8 mb-16">
                <div
                    className="rounded-full border-4 border-ink overflow-hidden"
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                    <div
                        className="flex"
                        style={{
                            transform: `translateX(${offset}px)`,
                            transition: animatingRef.current ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`: "none",
                        }}
                        onTransitionEnd={() => {
                            animatingRef.current = false;
                            setLanded(true);
                        }}>
                        {reel.map((letter, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center bg-sunset font-display font-bold text-ink text-5xl leading-none shrink-0"
                                style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                                {letter}
                            </div>
                        ))}
                    </div>
                </div>
                {isLeader && landed && (
                    <button
                        onClick={() => room.send("revealPrompts")}
                        className="bg-sky border-2 border-ink px-8 py-3 rounded-lg font-display font-bold text-ink">
                        Begin
                    </button>
                )}
            </div>
        </div>
    );
}