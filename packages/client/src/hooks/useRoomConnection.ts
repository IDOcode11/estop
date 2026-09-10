import { useCallback, useEffect ,useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import { RoomStateShape } from "../../../shared/src";

const SERVER_HOST = window.location.hostname
const SERVER_URL = `ws://${SERVER_HOST}:2567`; //Used as WebSocket for Colyseus
const HTTP_URL = `hhtp://${SERVER_HOST}:2567`; //Used as RESTful call
const RECONNECT_KEY = "estop_reconnection_token";

export function useRoomConnection() {
  const clientRef = useRef(new Client(SERVER_URL));
  const [room, setRoom] = useState<Room<RoomStateShape> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attachRoom = useCallback((joinedRoom: Room<RoomStateShape>) =>{
    localStorage.setItem(RECONNECT_KEY, joinedRoom.reconnectionToken);
    
    joinedRoom.onLeave(() =>{
      localStorage.removeItem(RECONNECT_KEY);
      setRoom(null);
    });
    
    setRoom(joinedRoom);
  }, []);

  const attemptedReconnect = useRef(false);
  useEffect(() => {
    if (attemptedReconnect.current)
      return;
    attemptedReconnect.current = true;

    const savedToken = localStorage.getItem(RECONNECT_KEY);
    if (!savedToken){
      setReconnecting(false);
      return;
    }

    clientRef.current
      .reconnect<RoomStateShape>(savedToken)
      .then((joinedRoom) => attachRoom(joinedRoom))
      .catch(() =>{ localStorage.removeItem(RECONNECT_KEY); })
      .finally(() => setReconnecting(false));
    
  }, [attachRoom]);

  const createRoom = useCallback(async (name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const joinedRoom = await clientRef.current.create<RoomStateShape>("game_room", { name });
      attachRoom(joinedRoom);

      return joinedRoom;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [attachRoom]);

  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`${HTTP_URL}/rooms/${roomCode}`);
      if (!res.ok)
        throw new Error("Room not found");

      const { roomId } = await res.json();
      
      const joinedRoom = await clientRef.current.joinById<RoomStateShape>(roomId, {name});
      attachRoom(joinedRoom);
      
      return joinedRoom;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [attachRoom]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(RECONNECT_KEY);
    localStorage.removeItem("estop_prompt_draft");
    room?.leave();
  }, [room]);

  return { room, connecting,reconnecting, error, createRoom, joinRoom, leaveRoom };
}