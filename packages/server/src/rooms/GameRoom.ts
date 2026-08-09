import { Room, Client } from "colyseus";
import { RoomState, Player, PromptSchema } from "./schema/RoomState";

export class GameRoom extends Room<RoomState> {
  maxClients = 15;

  onCreate(options: any) {
    // Initial state
    this.state = new RoomState();

    // register message handlers (one per client-triggered action)
  }

  onJoin(client: Client, options: any) {
    // Add a Player to state.players
    const player = new Player();
    player.name = options.name ?? `Player ${this.state.players.size + 1}`;
    player.connected = true;
    this.state.players.set(client.sessionId, player);

    // Assign leader if this is the first player
    if(!this.state.leaderId){
        this.state.leaderId = client.sessionId;
    }
  }

  async onLeave(client: Client, consented: boolean) {
    // Player disconnected 
    const player = this.state.players.get(client.sessionId);

    if(player)
        player.connected = false;

    if (consented){
        this.state.players.delete(client.sessionId);
        return;
    }

    // Handle reconnection window
    try{
        await this.allowReconnection(client, 90) //Wait 1:30 min
        if(player)
            player.connected = true;
    } catch {
        this.state.players.delete(client.sessionId);
    }
  }

  // --- phase transition helpers ---

  private startRandomizePhase() {
    // pick a letter not in usedLetters, add it, set phase = "randomize"
  }

  private startPromptPhase() {
    // set phase = "prompt"
  }

  private startScoringPhase() {
    // set phase = "scoring", reset currentPromptIndex and pointsInProgress
  }

  private startResultsPhase() {
    // set phase = "results"
  }

  private startNextRound() {
    // increment currentRound, pick new prompts, go back to startRandomizePhase()
    // or end the game if currentRound >= totalRounds
  }
}