// Google Gemini 2.5 Flash
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";

function getClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
}

/** Text completion — returns the assistant reply string */
export async function zhipuText(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
): Promise<string> {
  const client = getClient();
  const systemMsg = messages.find((m) => m.role === "system")?.content;
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const model = client.getGenerativeModel({
    model: MODEL,
    ...(systemMsg ? { systemInstruction: systemMsg } : {}),
  });

  const history = chatMsgs.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const last = chatMsgs[chatMsgs.length - 1]?.content ?? "";
  const result = await chat.sendMessage(last);
  return result.response.text();
}

/** Vision completion — base64 JPEG + text prompt, returns reply string */
export async function zhipuVision(imageBase64: string, prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
    prompt,
  ]);
  return result.response.text();
}

/** Streaming text — returns a ReadableStream of UTF-8 text chunks */
export async function zhipuStream(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
  const client = getClient();
  const systemMsg = messages.find((m) => m.role === "system")?.content;
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const model = client.getGenerativeModel({
    model: MODEL,
    ...(systemMsg ? { systemInstruction: systemMsg } : {}),
  });

  const history = chatMsgs.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const last = chatMsgs[chatMsgs.length - 1]?.content ?? "";
  const result = await chat.sendMessageStream(last);

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

// ── Prompt helpers ──────────────────────────────────────────────────────────

export function chatPrompt(
  difficulty: "easy" | "medium" | "hard",
  knownWords: string[],
  nativeLanguage: string,
  learningLanguage: string,
): string {
  const wordList = knownWords.slice(0, 30).join(", ");
  if (difficulty === "easy") {
    return `You are Koko, a friendly language tutor. The user speaks ${nativeLanguage} natively and is learning ${learningLanguage}.
Converse in ${nativeLanguage}, but naturally weave in these ${learningLanguage} words the user knows: ${wordList}.
Keep replies short (2-3 sentences). Gently highlight the ${learningLanguage} words you use by wrapping them in **asterisks**.`;
  }
  if (difficulty === "medium") {
    return `You are Koko, a friendly language tutor. The user is learning ${learningLanguage} (native: ${nativeLanguage}).
Have a short scaffolded conversation ONLY in ${learningLanguage}, using ONLY these words the user already knows: ${wordList}.
Keep sentences simple (subject + verb + object). If the user writes in ${nativeLanguage}, gently redirect them to use ${learningLanguage}.`;
  }
  return `You are Koko, an immersive ${learningLanguage} conversation partner. The user is learning ${learningLanguage} (native: ${nativeLanguage}).
Speak exclusively in ${learningLanguage} at a natural native level. Their known vocabulary includes: ${wordList}.
Introduce new words naturally in context. Correct grammar errors briefly and continue the conversation. Never switch to ${nativeLanguage}.`;
}

export function snapPrompt(
  nativeLanguage = "Thai",
  learningLanguage = "English",
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null = null,
): string {
  const cefrLine = cefrLevel
    ? `Calibrate difficulty for CEFR level ${cefrLevel}. Prefer words appropriate to that level; include 1-2 slightly above for stretch.`
    : `Target mixed difficulty (beginner-intermediate).`;

  return `You are Koko, a vocabulary learning AI.
Analyze this image and return EXACTLY 10 ${learningLanguage} vocabulary words that are:
- Visible in or contextually relevant to this scene
- Useful for adult learners
- ${cefrLine}

The user speaks ${nativeLanguage} natively and is learning ${learningLanguage}.

Label each word's natural part of speech. Do NOT force a distribution — if the scene yields 6 nouns and 4 verbs, return that.

Return JSON (no markdown):
{
  "scene": "Short scene description in ${nativeLanguage} (max 4 words)",
  "vocabulary": [
    {
      "word": "${learningLanguage} word",
      "translation": "${nativeLanguage} translation of the word",
      "example": "Natural ${learningLanguage} sentence using the word",
      "difficulty": "beginner|intermediate|advanced",
      "phonetic": "IPA notation",
      "partOfSpeech": "noun|verb|adjective|adverb|phrase|other"
    }
  ]
}`;
}
