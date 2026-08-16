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

/** One AR-pinned object detected in a Living Sandbox snap. */
export interface SnapObject {
  word: string;
  thai: string;
  because: string;
  /** Normalized bounding box, 0-1 relative to image width/height. */
  cropBox: { x: number; y: number; w: number; h: number };
}

/**
 * AR snap prompt — the Living Sandbox daily loop's only vision call.
 * Requests 4-5 CONCRETE, visible objects (never abstract/background words),
 * each with a normalized bounding box so the client can pin a Google-Lens
 * style pill label directly over the object in the frozen photo.
 */
export function snapPrompt(
  nativeLanguage = "Thai",
  learningLanguage = "English",
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null = null,
): string {
  const cefrLine = cefrLevel
    ? `Calibrate difficulty for CEFR level ${cefrLevel}. Prefer words appropriate to that level.`
    : `Target mixed difficulty (beginner-intermediate).`;

  return `You are Koko, a vocabulary learning AI for a Living Sandbox photo game.
Analyze this image and find up to 4 to 5 things a child could physically point at and pick up or touch — a real animal, object, tool, food, piece of furniture, article of clothing, etc.
Never return: text, numbers, letters, words, arrows, icons, logos, or any symbol/graphic printed or displayed on a surface (a label, a card, a screen, a sign) — those are not the object, they are marks on an object. Never return abstract ideas, colors alone, or the background/scene as a whole.
If the photo genuinely contains fewer than 4 such physical objects, return only the ones that are real — it is far better to return 1-3 honest objects than to pad the list with text or symbols. ${cefrLine}
The user speaks ${nativeLanguage} natively and is learning ${learningLanguage}.

For each object, give its precise bounding box as {x, y, w, h}, each a number from 0 to 1, where x/y is the top-left corner relative to image width/height and w/h is its size relative to image width/height.

Return JSON only, no markdown:
{
  "scene": "Short scene description in ${nativeLanguage} (max 4 words)",
  "objects": [
    {
      "word": "${learningLanguage} word for the object (lowercase, singular noun)",
      "thai": "${nativeLanguage} translation",
      "because": "One short, warm ${learningLanguage} sentence connecting the word to this photo",
      "cropBox": { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0 }
    }
  ]
}`;
}
