export interface BankPrompt {
    id: string;
    subject: string;
}

export const PROMPT_BANK: BankPrompt[] = [
      {id: "p1", subject: "Movie"},
      {id: "p2", subject: "Food"},
      {id: "p3", subject: "Place"},
      {id: "p4", subject: "Thing"},
      {id: "p5", subject: "Name"}
      //Need the rest of the list later
]