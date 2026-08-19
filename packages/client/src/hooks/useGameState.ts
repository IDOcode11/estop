import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "../../../shared/src/types"

export function useGameState(room: Room<RoomStateShape> | null) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!room) 
      return;

    const trigger = () => forceUpdate((n) => n + 1);
    room.onStateChange(trigger);

    return () => { room.removeAllListeners(); };
  }, [room]);

  return room?.state;
}