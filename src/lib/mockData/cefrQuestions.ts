export interface CEFRQuestion {
  id: string;
  sentence: string;
  correctAnswer: string;
  options: [string, string, string, string];
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1";
}

export interface CEFRResult {
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  sublevel: number;
  progress: number;
}

export const cefrQuestions: CEFRQuestion[] = [
  // A1 (4 questions, 1pt each)
  { id: "a1-1", sentence: "She ___ a teacher.", correctAnswer: "is", options: ["is", "are", "am", "be"], difficulty: "A1" },
  { id: "a1-2", sentence: "I ___ coffee every morning.", correctAnswer: "drink", options: ["drink", "eat", "make", "have"], difficulty: "A1" },
  { id: "a1-3", sentence: "They ___ to school by bus.", correctAnswer: "go", options: ["go", "come", "walk", "run"], difficulty: "A1" },
  { id: "a1-4", sentence: "We ___ happy to see you.", correctAnswer: "are", options: ["are", "is", "am", "was"], difficulty: "A1" },

  // A2 (4 questions, 1pt each)
  { id: "a2-1", sentence: "She had to ___ the deadline after the client requested changes.", correctAnswer: "extend", options: ["extend", "reject", "finalize", "submit"], difficulty: "A2" },
  { id: "a2-2", sentence: "I've been studying English ___ three years.", correctAnswer: "for", options: ["for", "since", "during", "while"], difficulty: "A2" },
  { id: "a2-3", sentence: "The meeting was ___ because of the storm.", correctAnswer: "cancelled", options: ["cancelled", "delayed", "moved", "postponed"], difficulty: "A2" },
  { id: "a2-4", sentence: "You should ___ your homework before dinner.", correctAnswer: "finish", options: ["finish", "end", "stop", "complete"], difficulty: "A2" },

  // B1 (5 questions, 2pts each)
  { id: "b1-1", sentence: "The manager asked us to ___ a detailed report by Friday.", correctAnswer: "submit", options: ["submit", "send", "write", "deliver"], difficulty: "B1" },
  { id: "b1-2", sentence: "We need to ___ the project timeline to accommodate the new requirements.", correctAnswer: "adjust", options: ["adjust", "change", "fix", "move"], difficulty: "B1" },
  { id: "b1-3", sentence: "The company decided to ___ its operations to Southeast Asia.", correctAnswer: "expand", options: ["expand", "grow", "extend", "increase"], difficulty: "B1" },
  { id: "b1-4", sentence: "She ___ her concerns about the new policy during the meeting.", correctAnswer: "expressed", options: ["expressed", "said", "told", "spoke"], difficulty: "B1" },
  { id: "b1-5", sentence: "The team will ___ the proposal before presenting it to the board.", correctAnswer: "review", options: ["review", "check", "see", "read"], difficulty: "B1" },

  // B2 (4 questions, 2pts each)
  { id: "b2-1", sentence: "The report ___ that sales have increased by 15% this quarter.", correctAnswer: "indicates", options: ["indicates", "shows", "tells", "speaks"], difficulty: "B2" },
  { id: "b2-2", sentence: "We must ___ the risks before making a final decision.", correctAnswer: "evaluate", options: ["evaluate", "think", "guess", "know"], difficulty: "B2" },
  { id: "b2-3", sentence: "The new strategy aims to ___ our competitive advantage in the market.", correctAnswer: "maintain", options: ["maintain", "keep", "hold", "save"], difficulty: "B2" },
  { id: "b2-4", sentence: "The CEO ___ that the merger would be completed by Q2.", correctAnswer: "confirmed", options: ["confirmed", "said", "agreed", "promised"], difficulty: "B2" },

  // C1 (3 questions, 3pts each)
  { id: "c1-1", sentence: "The board ___ the controversial measure despite widespread opposition.", correctAnswer: "ratified", options: ["ratified", "passed", "approved", "agreed"], difficulty: "C1" },
  { id: "c1-2", sentence: "The research ___ previous findings on climate change mitigation.", correctAnswer: "corroborates", options: ["corroborates", "supports", "proves", "backs"], difficulty: "C1" },
  { id: "c1-3", sentence: "The diplomat ___ the tensions between the two nations through careful negotiation.", correctAnswer: "alleviated", options: ["alleviated", "reduced", "fixed", "stopped"], difficulty: "C1" },
];

export function calculateCEFR(answers: boolean[], questions: CEFRQuestion[]): CEFRResult {
  const scoreByLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
  answers.forEach((correct, i) => {
    if (correct) scoreByLevel[questions[i].difficulty]++;
  });

  const levels: Array<"A1" | "A2" | "B1" | "B2" | "C1"> = ["C1", "B2", "B1", "A2", "A1"];
  const level = levels.find((l) => scoreByLevel[l] >= 3) ?? "A1";
  const sublevel = scoreByLevel[level] >= 4 ? 2 : 1;
  const progress = Math.min(
    99,
    (scoreByLevel[level] / 4) * 60 + (sublevel === 2 ? 15 : 0)
  );

  return { level, sublevel, progress };
}
