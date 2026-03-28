import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export function snapPrompt(nativeLanguage: string = "Thai", learningLanguage: string = "English") {
  return `You are Koko, a vocabulary learning AI.
Analyze this image and return EXACTLY 5-8 ${learningLanguage} vocabulary words that are:
- Visible in or contextually relevant to this scene
- Useful for adult learners
- At intermediate difficulty level

The user speaks ${nativeLanguage} natively and is learning ${learningLanguage}.

Return JSON (no markdown):
{
  "scene": "Short scene description in ${nativeLanguage} (max 4 words)",
  "vocabulary": [
    {
      "word": "${learningLanguage} word",
      "translation": "${nativeLanguage} translation of the word",
      "example": "Natural ${learningLanguage} sentence using the word",
      "difficulty": "beginner|intermediate|advanced",
      "phonetic": "IPA notation"
    }
  ]
}`;
}
