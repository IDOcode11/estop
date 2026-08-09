import { Room, Client, Delayed } from "colyseus";
import { RoomState, Player, PromptSchema, SubmissionSchema } from "./schema/RoomState";

export class GameRoom extends Room<RoomState> {
  maxClients = 15;

  private roomTimer: Delayed | null = null;

  onCreate(options: any) {
    this.state = new RoomState();

    //This is for checking when player submission and starts round timer
    this.onMessage("submitAnswers", (client, message: {answers: string[]}) =>{
      if (this.state.phase !== "prompt")
          return;

      const submission = new SubmissionSchema();
      message.answers.forEach( (answer) => submission.answers.push(answer));
      this.state.submissions.set(client.sessionId, submission);

      if(!this.roomTimer){
        this.roomTimer = this.clock.setTimeout( () =>{ this.forceSubmitAndAdvance(); }, this.state.answerTimeSeconds * 1000);
      }

      this.checkAllSubmitted();
    });
    
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

  // --- Phase transition helpers ---

  /**
   * Starts the alhpabet letter randomizer to choose letter for the round.
   */
  private startRandomizePhase() {
    // Note: I might add Ñ (Alt+165) later depending user feedback
    const alphapbet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const available = alphapbet.filter(
      (letter) => !this.state.usedLetters.includes(letter)
    );

    if (available.length == 0){
      throw new Error("No more letters remaining, round count should not exceed 26");
    }

    const roundLetter = available[Math.floor(Math.random() * available.length)];

    this.state.currentLetter = roundLetter;
    this.state.usedLetters.push(roundLetter);
    this.state.phase = "randomize";
  }

  /**
   * Starts the pormpt answering section.
   */
  private startPromptPhase() {
    this.state.phase = "prompt";
  }

  /**
   * Checks if all currently connected players have submitted their answers before the round timer.
   */
  private checkAllSubmitted() {
    const connectedPlayerIds = [...this.state.players.entries()]
      .filter( ([,player]) => player.connected)
      .map( ([id]) => id);

    const allSubmitted = connectedPlayerIds.every( (id) => this.state.submissions.has(id));

    if(allSubmitted)
        this.forceSubmitAndAdvance();

  }
  /**
   * Clears round timer, forces any submits if necessary, and moves on to the next phase.
   */
  private forceSubmitAndAdvance(){
    this.roomTimer?.clear();
    this.roomTimer = null;

    this.broadcast("forceSubmit");
    this.startScoringPhase();
  }

  /**
   * 
   */
  private startScoringPhase() {
    this.state.currentPromptIndex = 0;
    this.state.pointsInProgress.clear();
    this.state.phase = "scoring";
  }

  /**
   * 
   */
  private startResultsPhase() {
    // set phase = "results"
  }

  /**
   * 
   */
  private startNextRound() {
    // increment currentRound, pick new prompts, go back to startRandomizePhase()
    // or end the game if currentRound >= totalRounds
  }
}