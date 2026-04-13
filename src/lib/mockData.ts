// Re-export from cefrData for backward compatibility
export { cefrQuestions, calculateCEFR } from "./cefrData";
export type { CEFRLevel, CEFRResult } from "./cefrData";

// Re-export from mockData directory
export { conversationScenarios } from "./mockData/conversations";
export type { ConversationScenario, ConversationExchange } from "./mockData/conversations";
export { fillBlankQuestions } from "./mockData/fillBlankQuestions";
export type { FillBlankQuestion } from "./mockData/fillBlankQuestions";
export { weeklyStory } from "./mockData/stories";
export type { WeeklyStory, StoryWord } from "./mockData/stories";
