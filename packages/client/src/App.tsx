import { useState } from "react";
import { useRoomConnection } from "./hooks/useRoomConnection";
import { useGameState } from "./hooks/useGameState";
import JoinScreen from "./screens/JoinScreen";
import LobbyScreen from "./screens/LobbyScreen";
import RandomizeScreen from "./screens/RandomizeScreen";
// import PromptScreen from "./screens/PromptScreen";
// import ScoringScreen from "./screens/ScoringScreen";
// import ResultsScreen from "./screens/ResultsScreen";
// import FinalResultsScreen from "./screens/FinalResultsScreen";

export default function App() {
    const { room, connecting, error, createRoom, joinRoom } = useRoomConnection();
    const [name, setName] = useState("");
    const state = useGameState(room);

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

    if (!state)
      return null;

    switch (state.phase){
        case "lobby":
            return <LobbyScreen room={room}/>;
        case "randomize":
            return <RandomizeScreen room={room}/>;
        case "prompt":
        //     return <PromptScreen room={room}/>;
        case "scoring":
        //     return <ScoringScreen room={room}/>;
        case "results":
        //     return <ResultsScreen room={room}/>;
        case "finalResults":
        //     return <FinalResultsScreen room={room}/>;
        default:
            return <LobbyScreen room={room}/>;
    } 
}