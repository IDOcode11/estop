import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { RoomStateShape } from "shared";

/**
 * This is make the client side re-render when something changes 
 * since information is managed purely with Colyseus.
 * Reach does not see Colyseus changes if used directly. 
 * @param room 
 * @returns 
 */
export function useGameState(room: Room<RoomStateShape> | null) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!room) 
      return;

    const callback = () => forceUpdate((n) => n + 1);
    room.onStateChange(callback);

    return () => { room.onStateChange.remove(callback); };
  }, [room]);

  return room?.state;
}