export interface FillBlankQuestion {
  id: string;
  sentenceWithBlank: string;
  correctAnswer: string;
  options: [string, string, string, string];
  hint: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const fillBlankQuestions: FillBlankQuestion[] = [
  // Beginner (MCQ)
  { id: "fb-1", sentenceWithBlank: "I want to ___ to the store after work.", correctAnswer: "go", options: ["go", "come", "walk", "run"], hint: "g_", difficulty: "beginner" },
  { id: "fb-2", sentenceWithBlank: "She ___ breakfast every morning at 7.", correctAnswer: "eats", options: ["eats", "drinks", "makes", "cooks"], hint: "e___", difficulty: "beginner" },
  { id: "fb-3", sentenceWithBlank: "The children are ___ in the park.", correctAnswer: "playing", options: ["playing", "working", "sleeping", "studying"], hint: "p_______", difficulty: "beginner" },
  { id: "fb-4", sentenceWithBlank: "We need to ___ the house before the guests arrive.", correctAnswer: "clean", options: ["clean", "paint", "build", "sell"], hint: "c____", difficulty: "beginner" },
  { id: "fb-5", sentenceWithBlank: "He ___ his bicycle to school every day.", correctAnswer: "rides", options: ["rides", "drives", "flies", "walks"], hint: "r____", difficulty: "beginner" },

  // Advanced (open input)
  { id: "fb-6", sentenceWithBlank: "The company decided to ___ its operations to Southeast Asia.", correctAnswer: "expand", options: ["expand", "extend", "enlarge", "grow"], hint: "e_____", difficulty: "advanced" },
  { id: "fb-7", sentenceWithBlank: "We need to ___ the project timeline to accommodate the new requirements.", correctAnswer: "adjust", options: ["adjust", "change", "modify", "shift"], hint: "a_____", difficulty: "advanced" },
  { id: "fb-8", sentenceWithBlank: "The manager ___ the team for their excellent performance this quarter.", correctAnswer: "praised", options: ["praised", "thanked", "rewarded", "complimented"], hint: "p_____", difficulty: "advanced" },
  { id: "fb-9", sentenceWithBlank: "The report ___ that customer satisfaction has improved significantly.", correctAnswer: "indicates", options: ["indicates", "shows", "reveals", "suggests"], hint: "i_______", difficulty: "advanced" },
  { id: "fb-10", sentenceWithBlank: "She ___ her opinion during the board meeting yesterday.", correctAnswer: "expressed", options: ["expressed", "shared", "stated", "voiced"], hint: "e________", difficulty: "advanced" },
];
