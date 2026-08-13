import { Schema, ArraySchema , MapSchema, type } from "@colyseus/schema";


export class Player extends Schema {
  @type("string") name: string = "";
  @type("number") totalScore: number = 0;
  @type("number") roundScore: number = 0;
  @type("boolean") connected: boolean = true;
}

export class PromptSchema extends Schema {
  @type("string") id: string = "";
  @type("string") subject: string = "";
}

export class SubmissionSchema extends Schema {
  @type(["string"]) answers = new ArraySchema<string>();
}

export class RoomState extends Schema {
  @type("string") phase: string = "lobby";
  @type("string") leaderId: string = "";

  @type("string") currentLetter: string = "";
  @type(["string"]) usedLetters = new ArraySchema<string>();

  @type([PromptSchema]) currentPrompts = new ArraySchema<PromptSchema>();
  @type("number") currentPromptIndex: number = 0;
  @type({ map: SubmissionSchema }) submissions = new MapSchema<SubmissionSchema>();
  @type("number") answerTimeSeconds: number = 60;

  @type("number") currentRound: number = 0;
  @type("number") totalRounds: number = 0;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: "number" }) pointsInProgress = new MapSchema<number>(); //Points per round
}