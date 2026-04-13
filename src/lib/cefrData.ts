// Cambridge CEFR-aligned test content
// Sections: Reading, Writing, Listening, Speaking
// Levels covered: A1 → C1

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ReadingQuestion {
  type: "reading";
  level: CEFRLevel;
  passage: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
}

export interface WritingQuestion {
  type: "writing";
  level: CEFRLevel;
  sentence: string; // contains "_____"
  options: [string, string, string, string];
  correctAnswer: string;
}

export interface ListeningQuestion {
  type: "listening";
  level: CEFRLevel;
  audioText: string; // TTS source text
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
}

export interface SpeakingQuestion {
  type: "speaking";
  level: CEFRLevel;
  prompt: string;
  keywords: string[]; // at least 1 must appear in transcript to pass
  exampleAnswer: string;
}

export type CEFRQuestion =
  | ReadingQuestion
  | WritingQuestion
  | ListeningQuestion
  | SpeakingQuestion;

export interface CEFRSection {
  id: "reading" | "writing" | "listening" | "speaking";
  title: string;
  description: string;
  icon: string;
  questions: CEFRQuestion[];
}

// ─── READING SECTION ───────────────────────────────────────────────────────

const readingPassageA1: string = `
Tom is a student. He is ten years old. He goes to school every day. His school is near
his house. He walks to school with his friend Sam. At school, Tom likes art class and
maths. He has a dog named Rex. Rex is big and brown. After school, Tom plays with Rex
in the garden. His mum makes dinner at six o'clock. Tom's favourite food is pizza.
`.trim();

const readingPassageA: string = `
Maria works as a nurse at a large city hospital. She starts work at seven o'clock
in the morning and finishes at three o'clock in the afternoon. Every day she helps
patients, gives medicine, and writes reports. She likes her job because she can help
people. Maria has worked at the hospital for five years. Her colleagues say she is
very kind and hardworking. She always arrives on time and never complains. She also
volunteers at a local clinic on weekends. In her free time, she enjoys reading books
and going for long walks in the quiet park near her home.
`.trim();

const readingPassageB: string = `
The concept of "slow travel" has become increasingly popular in recent years. Unlike
traditional tourism, which focuses on visiting as many places as possible in a short
time, slow travel encourages people to stay in one place longer, connect with local
communities, and appreciate the culture in depth. Proponents argue that this approach
is not only more rewarding for the traveller but also more sustainable for the environment,
as it reduces the carbon footprint associated with frequent short-haul flights.
Furthermore, slow travellers tend to support local economies more directly.
`.trim();

export const readingQuestions: ReadingQuestion[] = [
  {
    type: "reading",
    level: "A1",
    passage: readingPassageA1,
    question: "What is the name of Tom's dog?",
    options: ["Sam", "Rex", "Max", "Tom"],
    correctAnswer: "Rex",
  },
  {
    type: "reading",
    level: "A2",
    passage: readingPassageA,
    question: "What time does Maria finish work?",
    options: ["7:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"],
    correctAnswer: "3:00 PM",
  },
  {
    type: "reading",
    level: "A2",
    passage: readingPassageA,
    question: "Why does Maria like her job?",
    options: [
      "Because she earns a lot of money",
      "Because she can help people",
      "Because the hospital is near her home",
      "Because she works short hours",
    ],
    correctAnswer: "Because she can help people",
  },
  {
    type: "reading",
    level: "B2",
    passage: readingPassageB,
    question: "According to the passage, what is one environmental benefit of slow travel?",
    options: [
      "It uses less electricity",
      "It reduces the carbon footprint from frequent flights",
      "It encourages people to recycle",
      "It eliminates the need for hotels",
    ],
    correctAnswer: "It reduces the carbon footprint from frequent flights",
  },
];

// ─── WRITING SECTION ───────────────────────────────────────────────────────

export const writingQuestions: WritingQuestion[] = [
  {
    type: "writing",
    level: "A2",
    sentence: "She _____ to school every day by bicycle.",
    options: ["go", "goes", "going", "gone"],
    correctAnswer: "goes",
  },
  {
    type: "writing",
    level: "B1",
    sentence: "By the time we arrived, the movie _____ already started.",
    options: ["has", "had", "have", "was"],
    correctAnswer: "had",
  },
  {
    type: "writing",
    level: "B2",
    sentence:
      "The report was so _____ that the committee decided to postpone the decision.",
    options: ["ambiguous", "obvious", "certain", "accurate"],
    correctAnswer: "ambiguous",
  },
  {
    type: "writing",
    level: "C1",
    sentence:
      "Despite the numerous _____ raised by critics, the policy was implemented without significant revision.",
    options: ["objections", "compliments", "agreements", "applause"],
    correctAnswer: "objections",
  },
];

// ─── LISTENING SECTION ─────────────────────────────────────────────────────

export const listeningQuestions: ListeningQuestion[] = [
  {
    type: "listening",
    level: "A2",
    audioText:
      "Hi, this is Tom. I'm calling to say that I can't come to the party on Saturday because I have to work. I'm really sorry. Can we meet on Sunday instead? Please call me back.",
    question: "Why can't Tom come to the party?",
    options: [
      "He is sick",
      "He has to work",
      "He forgot about it",
      "He is going on a trip",
    ],
    correctAnswer: "He has to work",
  },
  {
    type: "listening",
    level: "B1",
    audioText:
      "Good morning. This is an announcement for all passengers on flight TG402 to London. We regret to inform you that this flight has been delayed by approximately two hours due to a technical inspection. Passengers are advised to remain in the departure lounge. Complimentary refreshment vouchers will be distributed at gate seven. We apologise for any inconvenience caused.",
    question: "What should passengers do while waiting?",
    options: [
      "Go to the check-in desk",
      "Remain in the departure lounge",
      "Collect their luggage",
      "Proceed to gate seven immediately",
    ],
    correctAnswer: "Remain in the departure lounge",
  },
  {
    type: "listening",
    level: "B2",
    audioText:
      "Welcome to today's business briefing. Our third-quarter results show a fourteen percent increase in overall revenue, driven primarily by strong performance in our digital services division. However, operating costs have also risen by nine percent due to the expansion of our logistics infrastructure. The board has approved a new cost-efficiency programme that will be rolled out across all departments over the next six months. Employees will receive further details by email next week.",
    question: "What has caused operating costs to increase?",
    options: [
      "A decline in digital services revenue",
      "The expansion of logistics infrastructure",
      "Higher employee salaries",
      "Increased marketing expenditure",
    ],
    correctAnswer: "The expansion of logistics infrastructure",
  },
];

// ─── SPEAKING SECTION ──────────────────────────────────────────────────────

export const speakingQuestions: SpeakingQuestion[] = [
  {
    type: "speaking",
    level: "A2",
    prompt:
      "Describe what you did last weekend. Speak for about 30 seconds.",
    keywords: ["weekend", "went", "visited", "stayed", "played", "watched", "ate", "met", "family", "friend", "home", "park", "morning", "afternoon", "evening"],
    exampleAnswer:
      "Last weekend I stayed at home with my family. On Saturday morning we went to the park and had lunch together. In the afternoon I watched a movie.",
  },
  {
    type: "speaking",
    level: "B1",
    prompt:
      "What are the advantages and disadvantages of working from home? Give your opinion.",
    keywords: ["work", "home", "office", "advantage", "disadvantage", "flexible", "productivity", "commute", "communication", "balance", "isolation", "prefer", "think", "believe", "however", "although"],
    exampleAnswer:
      "I think working from home has several advantages. It gives you more flexibility and saves time on commuting. However, it can also be isolating and it may be harder to communicate with colleagues. I believe a balance between home and office work is the best solution.",
  },
];

// ─── FULL TEST SECTIONS ────────────────────────────────────────────────────

export const cefrTestSections: CEFRSection[] = [
  {
    id: "reading",
    title: "Reading",
    description: "Read the passages carefully and answer the questions.",
    icon: "📖",
    questions: readingQuestions,
  },
  {
    id: "writing",
    title: "Writing",
    description: "Choose the correct word to complete each sentence.",
    icon: "✍️",
    questions: writingQuestions,
  },
  {
    id: "listening",
    title: "Listening",
    description: "Listen to the audio and answer the questions.",
    icon: "🎧",
    questions: listeningQuestions,
  },
  {
    id: "speaking",
    title: "Speaking",
    description: "Speak your answer clearly into the microphone.",
    icon: "🎤",
    questions: speakingQuestions,
  },
];

// ─── CEFR SCORING ─────────────────────────────────────────────────────────

export interface SectionScore {
  sectionId: string;
  correct: number;
  total: number;
  ratio: number;
}

export interface CEFRResult {
  level: CEFRLevel;
  sublevel: number; // 0-100 within the level
  progress: number; // 0-100 overall
  sectionScores?: SectionScore[];
  description: string;
  color: string;
}

const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: "Beginner — You can understand and use very basic expressions and simple phrases.",
  A2: "Elementary — You can communicate in simple tasks and understand familiar topics.",
  B1: "Intermediate — You can handle most travel situations and describe experiences.",
  B2: "Upper Intermediate — You can understand complex texts and interact fluently.",
  C1: "Advanced — You can express ideas fluently and use language flexibly.",
  C2: "Mastery — You can understand virtually everything and express yourself spontaneously.",
};

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "#94a3b8",
  A2: "#60a5fa",
  B1: "#34d399",
  B2: "#fbbf24",
  C1: "#f97316",
  C2: "#a855f7",
};

// Section weights for scoring
const SECTION_WEIGHTS = {
  reading: 0.30,
  writing: 0.25,
  listening: 0.25,
  speaking: 0.20,
};

export function calculateCEFRResult(
  sectionScores: SectionScore[]
): CEFRResult {
  // Weighted total score 0-1
  let weightedScore = 0;
  for (const s of sectionScores) {
    const weight = SECTION_WEIGHTS[s.sectionId as keyof typeof SECTION_WEIGHTS] ?? 0.25;
    weightedScore += s.ratio * weight;
  }

  // Map to CEFR level
  let level: CEFRLevel;
  let sublevel: number;

  if (weightedScore >= 0.92) { level = "C2"; sublevel = Math.round((weightedScore - 0.92) / 0.08 * 100); }
  else if (weightedScore >= 0.80) { level = "C1"; sublevel = Math.round((weightedScore - 0.80) / 0.12 * 100); }
  else if (weightedScore >= 0.65) { level = "B2"; sublevel = Math.round((weightedScore - 0.65) / 0.15 * 100); }
  else if (weightedScore >= 0.48) { level = "B1"; sublevel = Math.round((weightedScore - 0.48) / 0.17 * 100); }
  else if (weightedScore >= 0.28) { level = "A2"; sublevel = Math.round((weightedScore - 0.28) / 0.20 * 100); }
  else { level = "A1"; sublevel = Math.round(weightedScore / 0.28 * 100); }

  return {
    level,
    sublevel: Math.min(100, Math.max(0, sublevel)),
    progress: Math.round(weightedScore * 100),
    sectionScores,
    description: LEVEL_DESCRIPTIONS[level],
    color: LEVEL_COLORS[level],
  };
}

// ─── LEGACY COMPAT (used by existing result page) ─────────────────────────

export interface LegacyCEFRQuestion {
  sentence: string;
  options: [string, string, string, string];
  correctAnswer: string;
}

export const cefrQuestions: LegacyCEFRQuestion[] = writingQuestions.map((q) => ({
  sentence: q.sentence,
  options: q.options,
  correctAnswer: q.correctAnswer,
}));

export function calculateCEFR(
  answers: boolean[],
  _questions: LegacyCEFRQuestion[]
): { level: CEFRLevel; sublevel: number; progress: number; description: string; color: string } {
  const correct = answers.filter(Boolean).length;
  const total = answers.length || 1;
  const ratio = correct / total;

  const sectionScores: SectionScore[] = [
    { sectionId: "writing", correct, total, ratio },
  ];

  const result = calculateCEFRResult(sectionScores);
  return {
    level: result.level,
    sublevel: result.sublevel,
    progress: result.progress,
    description: result.description,
    color: result.color,
  };
}

// ─── EASIER RETEST CONTENT (for streak ≥ 3) ───────────────────────────────

export const retestSections: CEFRSection[] = [
  {
    id: "reading",
    title: "Reading",
    description: "Read the short text and answer the question.",
    icon: "📖",
    questions: [readingQuestions[0]], // A2 only
  },
  {
    id: "writing",
    title: "Writing",
    description: "Choose the correct word to complete the sentence.",
    icon: "✍️",
    questions: [writingQuestions[0]], // A2 only
  },
  {
    id: "listening",
    title: "Listening",
    description: "Listen and answer.",
    icon: "🎧",
    questions: [listeningQuestions[0]], // A2 only
  },
  {
    id: "speaking",
    title: "Speaking",
    description: "Speak your answer into the microphone.",
    icon: "🎤",
    questions: [speakingQuestions[0]], // A2 only
  },
];
