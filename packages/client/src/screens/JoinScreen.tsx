import { useState } from "react";

interface JoinScreenProps{
    connecting: boolean;
    error: string | null;
    onCreate: (name: string) => void;
    onJoin: (roomCode: string, name: string) => void;
}

export default function JoinScreen({ connecting, error, onCreate, onJoin}: JoinScreenProps){
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
            <div className="w-40 h-40 rounded-full bg-sunset border-4 border-ink flex items-center justify-center font-display font-bold text-ink text-xl">
                Estop
            </div>
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-4">
                    <input
                        placeholder="Name (10 characters)"
                        maxLength={10}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white border-2 border-ink placeholder-ink/50 rounded-lg px-4 py-3 font-semibold text-ink"/>
                    <input
                        placeholder="Room ID"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="bg-white border-2 border-ink placeholder-ink/50 rounded-lg px-4 py-3 font-semibold text-ink"/>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <button
                        disabled={!name || connecting}
                        onClick={() => onCreate(name)}
                        className="bg-sunset border-2 border-ink rounded-lg px-4 py-3 font-display font-bold text-ink disabled:opacity-50">
                        Make Room
                    </button>
                    <button
                        disabled={!name || !roomCode || connecting}
                        onClick={() => onJoin(roomCode, name)}
                        className="bg-sky border-2 border-ink rounded-lg px-4 py-3 font-display font-bold text-ink disabled:opacity-50">
                        Join by ID
                    </button>
                </div>
            </div>

            {error && <p className="text-coral font-semibold">{error}</p>}
        </div>
    );
}