import { useCallback, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";

const SERVER_URL = "ws://localhost:2567";

export function useRoomConnection() {
  const clientRef = useRef(new Client(SERVER_URL));
  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const joinedRoom = await clientRef.current.create("game_room", { name });
      setRoom(joinedRoom);
      return joinedRoom;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const joinedRoom = await clientRef.current.joinById(roomId, { name });
      setRoom(joinedRoom);
      return joinedRoom;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  return { room, connecting, error, createRoom, joinRoom };
}