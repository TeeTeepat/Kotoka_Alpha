// Living Sandbox (FindWord) — object identification + neighbour word generation.
// Follows the Gemini client pattern from src/lib/gemini.ts.
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";

function getClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
}

export interface IdentifiedObject {
  label: string;
  alternates: [string, string];
}

export interface NeighbourWord {
  word: string;
  thai: string;
  because: string;
}

/** Strip markdown code fences Gemini sometimes wraps around JSON. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

/**
 * Identify the single main object in a photo.
 * Returns the best label plus exactly 2 alternates (shown when the user taps "no").
 */
export async function identifyObject(imageBase64: string): Promise<IdentifiedObject> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  });

  const prompt = `Identify the single most prominent everyday object in this photo.
Return JSON only, no markdown:
{
  "label": "the object as one simple English noun (lowercase, singular)",
  "alternates": ["second most likely object name", "third most likely object name"]
}
Rules:
- "label" is your best guess for what the object is.
- "alternates" are the 2 next most plausible identifications, different from the label.
- Use concrete, common nouns a child learner would recognise (e.g. "dog", "chair", "bicycle").`;

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
    prompt,
  ]);

  const parsed = JSON.parse(stripFences(result.response.text())) as {
    label?: unknown;
    alternates?: unknown;
  };

  const label = typeof parsed.label === "string" && parsed.label.trim() ? parsed.label.trim() : "object";
  const alts = Array.isArray(parsed.alternates)
    ? parsed.alternates.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    : [];
  const alternates: [string, string] = [alts[0]?.trim() ?? "thing", alts[1]?.trim() ?? "item"];

  return { label, alternates };
}

function neighboursPrompt(seedLabel: string, cefr: string, k: number): string {
  return `You are Koko, a vocabulary learning AI for Thai children learning English.

The learner just photographed and confirmed this object: "${seedLabel}".
Generate EXACTLY ${k} English words closely related to "${seedLabel}" — parts of it, things found near it, actions done with it, or properties of it.

Rules:
- Calibrate every word to CEFR level ${cefr}.
- Do NOT include "${seedLabel}" itself.
- No duplicates.
- "because" is one short, warm English sentence explaining how the word connects to "${seedLabel}" (this is shown to the child later as a memory hook).
- "thai" is the natural Thai translation of the word.

Return JSON only, no markdown — an array of exactly ${k} items:
[
  { "word": "English word", "thai": "Thai translation", "because": "Because sentence linking it to ${seedLabel}." }
]`;
}

function parseNeighbours(text: string, k: number): NeighbourWord[] {
  const parsed = JSON.parse(stripFences(text)) as unknown;
  const arr = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { words?: unknown }).words)
      ? ((parsed as { words: unknown[] }).words)
      : null;
  if (!arr) throw new Error("Neighbours response is not an array");

  const words = arr
    .filter(
      (it): it is { word: string; thai: string; because: string } =>
        typeof it === "object" &&
        it !== null &&
        typeof (it as { word?: unknown }).word === "string" &&
        typeof (it as { thai?: unknown }).thai === "string" &&
        typeof (it as { because?: unknown }).because === "string"
    )
    .map((it) => ({
      word: it.word.trim(),
      thai: it.thai.trim(),
      because: it.because.trim(),
    }));

  if (words.length === 0) throw new Error("Neighbours response contained no valid items");
  return words.slice(0, k);
}

/**
 * Generate k neighbour words for a confirmed seed label at the given CEFR level.
 * Deterministic (temperature 0), JSON-mode, with one retry on malformed JSON.
 */
export async function neighbours(
  seedLabel: string,
  cefr: string,
  k: number
): Promise<NeighbourWord[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  });

  const prompt = neighboursPrompt(seedLabel, cefr, k);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await model.generateContent(prompt);
    try {
      return parseNeighbours(result.response.text(), k);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `neighbours: failed to parse Gemini JSON after retry: ${String(lastError)}`
  );
}
