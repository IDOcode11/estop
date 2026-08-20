import { useCallback, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import { RoomStateShape } from "../../../shared/src";

const SERVER_URL = "ws://localhost:2567"; //Used as WebSocket for Colyseus
const HTTP_URL = "http://localhost:2567"; //Used as RESTful call

export function useRoomConnection() {
  const clientRef = useRef(new Client(SERVER_URL));
  const [room, setRoom] = useState<Room<RoomStateShape> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const joinedRoom = await clientRef.current.create<RoomStateShape>("game_room", { name });
      joinedRoom.onLeave(() => setRoom(null));
      setRoom(joinedRoom);
      return joinedRoom;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`${HTTP_URL}/rooms/${roomCode}`);
      if (!res.ok)
        throw new Error("Room not found");

      const { roomId } = await res.json();
      
      const joinedRoom = await clientRef.current.joinById<RoomStateShape>(roomId, {name});
      joinedRoom.onLeave(() => setRoom(null));
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