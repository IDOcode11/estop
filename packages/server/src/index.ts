import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";
import { resolveRoomCode } from "./data/roomCodes";

const port = Number(process.env.PORT) || 2567;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({ server: httpServer});

gameServer.define("game_room", GameRoom);

app.use("/colyseus", monitor());

app.get("/health", (_req, res) => res.json({ ok: true}));

app.get("/rooms/:code", (req, res) =>{
    const roomId = resolveRoomCode(req.params.code);

    if (!roomId)
      return res.status(404).json({ error: "Room not found"});
    
    res.json({ roomId });
});

gameServer.listen(port);
console.log(`Colyseus server listening on ws://localhost:${port}`);