export interface StoryWord {
  word: string;
  definition: string;
}

export interface WeeklyStory {
  id: string;
  title: string;
  emoji: string;
  text: string;
  highlightedWords: StoryWord[];
  reflectionQuestion: {
    question: string;
    options: string[];
  };
  weekNumber: number;
}

export const weeklyStory: WeeklyStory = {
  id: "story-week-14",
  title: "Mana's Tuesday",
  emoji: "📖",
  weekNumber: 14,
  text: `It was a Tuesday when Mana had to reschedule the client meeting. The agenda was long but focused — she felt productive walking through the familiar office corridor.

At the café downstairs, the barista recommended the special: lavender honey latte. The ambience was perfect for reviewing her proposal one last time.

After lunch, she submitted the budget report to her manager. "Excellent work," he said. She smiled — the deadline stress was worth it.

On the train home, Mana watched the sunset through the window. Tomorrow would be busy, but today she had followed up on every task. Sometimes, the best days are the ordinary ones.`,
  highlightedWords: [
    { word: "reschedule", definition: "to change the time of a planned event" },
    { word: "agenda", definition: "a list of items to be discussed at a meeting" },
    { word: "productive", definition: "achieving a significant amount or result" },
    { word: "recommended", definition: "suggested as being good or suitable" },
    { word: "ambience", definition: "the character and atmosphere of a place" },
    { word: "proposal", definition: "a plan or suggestion put forward for consideration" },
    { word: "submitted", definition: "presented for consideration or judgment" },
    { word: "deadline", definition: "the latest time or date by which something should be completed" },
  ],
  reflectionQuestion: {
    question: "Which word from today's story felt most natural for you?",
    options: ["reschedule", "productive", "ambience"],
  },
};
