import { useState } from "react";
import { useRoomConnection } from "./hooks/useRoomConnection";
import JoinScreen from "./screens/JoinScreen";
import LobbyScreen from "./screens/LobbyScreen";


export default function App() {
    const { room, connecting, error, createRoom, joinRoom } = useRoomConnection();
    const [name, setName] = useState("");

    if (!room) {
        return (
            <JoinScreen
                connecting={connecting}
                error={error}
                onCreate={(n) => {
                    setName(n);
                    createRoom(n);
                }}
                onJoin={(code, n) => {
                    setName(n);
                    joinRoom(code, n);
                }}
            />
        );
    }

    return <LobbyScreen room={room}/>;
      
}