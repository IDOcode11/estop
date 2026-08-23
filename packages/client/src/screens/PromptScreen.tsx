import { useState, useEffect, useRef} from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";
import RoomCodeBadge from "../components/RoomCodeBadge";

interface PromptScreenProps{
    room: Room<RoomStateShape>;
}
const DRAFT_KEY = "estop_prompt_draft"

export default function PromptScreen({ room }: PromptScreenProps){
    const state = useGameState(room);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>(() =>{
        const savedAnswers = localStorage.getItem(DRAFT_KEY);
        return savedAnswers ? JSON.parse(savedAnswers) : [];
    });
    const [viewed, setViewed] = useState<Set<number>>(new Set([0]));
    const [remaining, setRemaining] = useState(0);
    const answersRef = useRef(answers);

    useEffect(() =>{
        answersRef.current = answers;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    }, [answers]);

    useEffect(() => {
        if (!state?.currentPrompts) 
          return;
        
        if (answers.length !== state.currentPrompts.length){
          setAnswers(new Array(state.currentPrompts.length).fill(""));
        }

    }, [state?.currentPrompts]);

    useEffect(() => {
        if (!state?.timerEndsAt){
            setRemaining(0);
            return;
        }

        const tick = () =>{
            setRemaining(Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000)));
        };
        tick();

        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [state?.timerEndsAt]);

    useEffect(() => {
        const unbind = room.onMessage("forceSubmit", () =>{
            room.send("submitAnswers", { answers: answersRef.current});
            localStorage.removeItem(DRAFT_KEY);
        });

        return () =>{
            unbind();
        };

    }, [room]);

    if (!state || !state.currentPrompts) 
      return null;

    const promptCount = state.currentPrompts.length;
    const prompt = state.currentPrompts[index];
    const allViewed = viewed.size >= promptCount;

    const movePrompt = (newIndex: number) =>{
        if (newIndex < 0){
            setIndex(0);
            return; 
        } else if (newIndex >= promptCount){
            setIndex(promptCount-1);
            return;
        } else {
            setIndex(newIndex);
            setViewed((prev) => new Set(prev).add(newIndex));
        }
    };

    const updateAnswer = (value: string) =>{
        setAnswers((prev) =>{
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const submit = () =>{
        room.send("submitAnswers", { answers });
        localStorage.removeItem(DRAFT_KEY);
    };

    return(
        <div className="min-h-screen bg-gray-200 flex flex-col items-center p-6 gap-6">
            <RoomCodeBadge code={state.roomCode}/>
            <div className="w-full max-w-2xl flex items-center justify-between">
                <div className="w-16 h-16 rounded-full bg-green-400 flex items-center justify-center font-bold text-gray-800 text-xl">
                    {state.currentLetter}
                </div>

                {state.timerEndsAt > 0 && (
                    <div className="bg-orange-300 rounded-lg px-6 py-3 font-bold text-gray-800">
                        {remaining}s
                    </div>
                )}

                <button
                    disabled={!allViewed}
                    onClick={submit}
                    className="bg-sky-400 px-6 py-3 rounded-lg font-bold text-gray-800 disabled:opacity-50">
                    Submit
                </button>
            </div>
            <div className="w-full max-w-2xl flex items-center gap-4">
                <button
                    onClick={() => movePrompt(index - 1)}
                    disabled={index === 0}
                    className="text-3xl font-bold text-gray-700 disabled:opacity-30">
                    ‹
                </button>
                <div className="flex-1 bg-yellow-100 rounded-lg p-6 flex flex-col gap-4">
                    <div className="bg-purple-300 rounded-lg px-4 py-2 font-bold text-gray-800 self-center-safe">
                        {prompt.subject}
                    </div>
                    <input
                        value={answers[index] ?? ""}
                        onChange={(e) => updateAnswer(e.target.value)}
                        className="bg-gray-100 rounded-lg px-4 py-3"
                        placeholder={`Starts with "${state.currentLetter}"`}
                    />
                </div>
                <button
                    onClick={() => movePrompt(index + 1)}
                    disabled={index === promptCount - 1}
                    className="text-3xl font-bold text-gray-700 disabled:opacity-30">
                    ›
                </button>
            </div>
        </div>
    );
}