export interface BankPrompt {
    id: string;
    subject: string;
}

export const PROMPT_BANK: BankPrompt[] = [
      {id: "p1", subject: "First Name"},
      {id: "p2", subject: "Last Name"},
      {id: "p3", subject: "Thing"},
      {id: "p4", subject: "Animal"},
      {id: "p5", subject: "Fruit/Vegetable"},
      {id: "p6", subject: "Country/Municipal"}
]