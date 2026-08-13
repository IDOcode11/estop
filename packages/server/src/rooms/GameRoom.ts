import { Room, Client, Delayed } from "colyseus";
import { RoomState, Player, PromptSchema, SubmissionSchema } from "./schema/RoomState";
import { PROMPT_BANK } from "../data/promptBank";
import { registerRoomCode } from "../data/roomCodes";

export class GameRoom extends Room<RoomState> {
  maxClients = 16;



  private roomTimer: Delayed | null = null;


  onCreate(options: any) {
    this.state = new RoomState();
    this.state.roomCode = registerRoomCode(this.roomId);

    /**
     * This is the lobby configuration for the game
     */
    this.onMessage("updateSettings", (client, message: {totalRounds?: number; answerTimeSeconds?: number }) =>{
      if (this.state.phase !== "lobby")
        return;
      if (client.sessionId !== this.state.leaderId)
        return;

      if (message.totalRounds !== undefined)
        this.state.totalRounds = Math.min(Math.max(message.totalRounds, 1), 26);

      if (message.answerTimeSeconds !== undefined)
        this.state.answerTimeSeconds = Math.min(Math.max(message.answerTimeSeconds, 15), 150);
    });

    //This is the lobby "Start" declaration 
    this.onMessage("startGame", (client) =>{
      if (this.state.phase !== "lobby")
        return;
      if (client.sessionId !== this.state.leaderId)
        return;

      this.state.currentPrompts.clear();
      PROMPT_BANK.forEach((prompt) =>{
          const promptSchema = new PromptSchema();
          promptSchema.id = prompt.id;
          promptSchema.subject = prompt.subject;
          this.state.currentPrompts.push(promptSchema);
      });

      this.state.currentRound = 0;
      this.startRandomizePhase();
    });

    //This is a leader button interaction to move to prompt phase
    this.onMessage("revealPrompts", (client) => {
      if (this.state.phase !== "randomize") 
        return;
      
      if (client.sessionId !== this.state.leaderId) 
        return;

      this.startPromptPhase();
    });

    //This is for checking when player submission and starts round timer
    this.onMessage("submitAnswers", (client, message: {answers: string[]}) =>{
      if (this.state.phase !== "prompt")
          return;

      const submission = new SubmissionSchema();
      message.answers.forEach( (answer) => submission.answers.push(answer));
      this.state.submissions.set(client.sessionId, submission);

      if (!this.roomTimer){
        this.roomTimer = this.clock.setTimeout( () =>{ this.forceSubmitAndAdvance(); }, this.state.answerTimeSeconds * 1000);
      }

      this.checkAllSubmitted();
    });
    
    //This is for adding points to each player for a prompt
    this.onMessage("awardPoints", (client, message: {toPlayerId: string; points: number }) =>{
      if (this.state.phase !== "scoring") 
        return;
      
      if (client.sessionId !== this.state.leaderId) 
        return;

      if(![0,5,10].includes(message.points))
        return;

      this.state.pointsInProgress.set(message.toPlayerId, message.points);
    });

    /**
     * This add up the points:
     *  - pointsInProgress -> roundScore, per prompt
     *  - roundScore -> totalScore, per round
     */
    this.onMessage("continueScoring", (client) => {
      if (this.state.phase !== "scoring") 
        return;

      if (client.sessionId !== this.state.leaderId) 
        return;

      this.state.pointsInProgress.forEach((points, playerId) => {
        const player = this.state.players.get(playerId);
        
        if (player) 
          player.roundScore += points;
      });

      this.state.pointsInProgress.clear();

      const isLastPrompt = this.state.currentPromptIndex >= this.state.currentPrompts.length - 1;

      if (isLastPrompt){
        for (const player of this.state.players.values()){
          player.totalScore += player.roundScore;
        }

        this.startResultsPhase();
      } else{
        this.state.currentPromptIndex++;
      }
    });

    //This is a leader button interaction to continue to the next round
    this.onMessage("continueToNextRound", (client) => {
      if (this.state.phase !== "results") 
        return;
      
      if (client.sessionId !== this.state.leaderId) 
        return;
      
      if (this.state.currentRound >= this.state.totalRounds - 1) 
        return;

      this.startNextRound();
    });

    //This is an interaction to end the game early
    this.onMessage("endGame", (client) =>{
      if (this.state.phase !== "results")
        return;
      if (client.sessionId !== this.state.leaderId)
        return;

      this.state.phase = "finalResults";
    });
  }

  onJoin(client: Client, options: any) {
    // Add a Player to state.players
    const player = new Player();
    player.name = options.name ?? `Player ${this.state.players.size + 1}`;
    player.connected = true;
    this.state.players.set(client.sessionId, player);

    // Assign leader if this is the first player
    if (!this.state.leaderId){
        this.state.leaderId = client.sessionId;
    }
  }

  async onLeave(client: Client, consented: boolean) {
    // Player disconnected 
    const player = this.state.players.get(client.sessionId);

    if (player)
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
        this.removePlayer(client.sessionId);
    }
  }

  /**
   * Removes player from game and changes leader if the leader left
   * @param sessionId 
   */
  private removePlayer(sessionId: string){
    this.state.players.delete(sessionId);

    if (this.state.leaderId === sessionId){
        const nextLeader = [...this.state.players.keys()][0];
        this.state.leaderId = nextLeader ?? "";
    }
  }

  // -------------------------- Phase transition helpers  -------------------------
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
   * Starts the prompt answering section and clears previous round answers.
   */
  private startPromptPhase() {
    this.state.submissions.clear();
    this.state.phase = "prompt";
  }

  /**
   * Checks if all currently connected players have submitted their answers before the round timer.
   * If so, then head to next phase.
   */
  private checkAllSubmitted() {
    const connectedPlayerIds = [...this.state.players.entries()]
      .filter( ([,player]) => player.connected)
      .map( ([id]) => id);

    const allSubmitted = connectedPlayerIds.every( (id) => this.state.submissions.has(id));

    if (allSubmitted){
        this.roomTimer?.clear();
        this.roomTimer = null;
        this.fillMissingSubmissions();
        this.startScoringPhase();
    }
  }

  /**
   * Clears round timer, forces any submits if necessary, and moves on to the next phase.
   */
  private forceSubmitAndAdvance(){
    this.roomTimer?.clear();
    this.roomTimer = null;

    this.broadcast("forceSubmit");

    this.clock.setTimeout( () =>{
      this.fillMissingSubmissions();
      this.startScoringPhase();
    }, 2000);
  }

  /**
   * If a player is disconnected and did not submit, it will fill prompts with blank answers
   */
  private fillMissingSubmissions(){
    const promptCount = this.state.currentPrompts.length;

    for (const [playerId] of this.state.players.entries()) {
      if (this.state.submissions.has(playerId)) 
        continue;

      const submission = new SubmissionSchema();
      for (let i = 0; i < promptCount; i++){
        submission.answers.push("");
      }
      this.state.submissions.set(playerId, submission);
    }
  }

  /**
   * Starts the scoring process by clearing the previous points for each player
   * and starting the synced view in the first prompt.
   */
  private startScoringPhase() {
    this.state.currentPromptIndex = 0;
    this.state.pointsInProgress.clear();
    this.state.phase = "scoring";
  }

  /**
   * Starts the view results page
   */
  private startResultsPhase() {
    this.state.phase = "results";
  }

  /**
   * Resets the points for the round of each player 
   * and start the next round if it is not the final round
   */
  private startNextRound() {
    this.state.currentRound++;

    for (const player of this.state.players.values()){
      player.roundScore = 0;
    }

    if (this.state.currentRound >= this.state.totalRounds){
      this.state.phase = "finalResults";
      return;
    }

    this.startRandomizePhase();
  }
}