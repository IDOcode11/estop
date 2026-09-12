import React, { useState, useEffect, useRef} from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";
import { useGameState } from "../hooks/useGameState";

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
    const [remainingMs, setRemainingMs] = useState(0);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    const answersRef = useRef(answers);
    const inputRef = useRef<HTMLInputElement>(null);
    const touchStartX = useRef<number | null>(null);

    const seconds = Math.floor(remainingMs / 1000);
    const centiseconds = Math.floor((remainingMs % 1000) / 10);
    const timerDisplay = `${String(seconds).padStart(2,"0")}:${String(centiseconds).padStart(2,"0")}`;
    const SWIPE_THRESHOLD = 50;


    //Keeps the keyboard on when on mobile
    useEffect(() => {
        inputRef.current?.focus();
    }, [index]);

    //Player answers for the prompts
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

    //Stop timer
    useEffect(() => {
        if (!state?.timerEndsAt){
            setRemainingMs(0);
            return;
        }

        const tick = () =>{
            setRemainingMs(Math.max(0, state.timerEndsAt - Date.now()));
        };
        tick();

        const interval = setInterval(tick, 30);
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
    const hasSubmitted = state.submissions.has(room.sessionId);

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

        if (validationError)
          setValidationError(null);
    };

    const submit = () =>{
        const isFirstSubmit = state.timerEndsAt === 0;

        if (isFirstSubmit){
            const hasBlank = answers.some((a) => a.trim().length === 0);
            if (hasBlank){
                setValidationError("Fill in every answer before submitting first.")
                return;
            }
        }
        setValidationError(null);
        room.send("submitAnswers", { answers });
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleTouchStart = (e: React.TouchEvent) =>{
        touchStartX.current = e.touches[0].clientX;
    }

    const handleTouchEnd = (e: React.TouchEvent) =>{
        if (touchStartX.current == null)
          return;

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;

        if (Math.abs(deltaX) > SWIPE_THRESHOLD){
            if (deltaX < 0){
                movePrompt(index + 1);
            } else {
                movePrompt(index - 1);
            }
        }

        touchStartX.current = null;
    }

    return(
        <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>
            <div className="flex flex-col items-center gap-6 mb-16">
                <div className="w-full max-w-2xl grid grid-cols-3 items-center">
                    <div className="justify-self-start w-16 h-16 rounded-full bg-sunset border-2 border-ink flex items-center justify-center font-display font-bold text-ink text-xl leading-none">
                        {state.currentLetter}
                    </div>
                    <div className="justify-self-center">
                        {state.timerEndsAt > 0 ? (
                            <div className="bg-coral border-2 border-ink rounded-lg px-6 py-3 font-display font-bold text-ink">
                                {timerDisplay}
                            </div>
                            ) : (
                            <div className="invisible bg-coral border-2 border-ink rounded-lg px-6 py-3 font-display font-bold">
                                00:00
                            </div>
                        )}
                    </div>
                    <div className="fjustify-self-end flex flex-col items-end gap-1">
                        <button
                            disabled={!allViewed}
                            onClick={submit}
                            className={`border-2 border-ink px-6 py-3 rounded-lg font-display font-bold text-ink disabled:opacity-50 ${hasSubmitted ? "bg-mint" : "bg-sky"}`}>
                            STOP
                        </button>
                        {validationError && (
                            <p className="text-coral text-sm font-semibold max-w-45 text-right">
                                {validationError}
                            </p>
                        )}
                    </div>
                </div>
                <div className="w-full max-w-2xl flex items-center gap-4">
                    <button
                        onClick={() => movePrompt(index - 1)}
                        disabled={index === 0}
                        className="text-3xl font-bold text-ink disabled:opacity-30">
                        ‹
                    </button>
                    <div 
                        className="flex-1 bg-white border-2 border-ink rounded-lg p-6 flex flex-col gap-4 animate-[prompt-in_200ms_ease_out]"
                        >
                        <div className="bg-sky/30 border-2 border-ink rounded-lg px-4 py-2 font-display font-bold text-ink self-center">
                            {prompt.subject}
                        </div>
                        <input
                            ref={inputRef}
                            maxLength={40}
                            value={answers[index] ?? ""}
                            onChange={(e) => updateAnswer(e.target.value)}
                            className="bg-white border-2 border-ink rounded-lg px-4 py-3 text-ink"
                            placeholder={`Starts with "${state.currentLetter}"`}
                        />
                    </div>
                    <button
                        onClick={() => movePrompt(index + 1)}
                        disabled={index === promptCount - 1}
                        className="text-3xl font-bold text-ink disabled:opacity-30">
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
}