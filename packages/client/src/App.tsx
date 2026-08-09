import { useState } from "react";
import { useRoomConnection } from "./useRoomConnection";

export default function App() {
    const { room, connecting, error, createRoom, joinRoom } = useRoomConnection();
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");

    if(room){
        return (
            <div>
                <h1>Connected to room: {room.roomId}</h1>
                <p>You are: {name}</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-blue-600">Estop</h1>
            <input 
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <div>
                <button disabled={!name || connecting} onClick={() => createRoom(name)}> Create Room </button>
            </div>
            <div>
                <input 
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                />
                <button disabled={!name || !roomId || connecting} onClick={() => joinRoom(roomId, name)}> Join Room </button>
            </div>
            {error && <p style={{color: "red"}}> {error} </p>}
        </div>
    );
}