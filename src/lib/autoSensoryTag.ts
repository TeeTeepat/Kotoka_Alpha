import { getSoundForTags } from "./ambientSounds";
import { zhipuText, zhipuVision } from "./gemini";

export interface AutoTagResult {
  emotionTag: string;
  atmosphereTag: string;
  compoundTag: string;
  soundId: string;
  soundName: string;
  soundEmoji: string;
  weatherRaw?: { condition: string; temp: number };
  gpsZone?: string;
}

// Map GPS category/type to atmosphere zone
export function gpsToZone(nominatimData: Record<string, unknown>): string {
  const category = (nominatimData.category as string) ?? "";
  const type = (nominatimData.type as string) ?? "";
  const address = (nominatimData.address as Record<string, string>) ?? {};
  const road = address.road ?? "";
  const suburb = address.suburb ?? "";

  if (category === "office" || (category === "commercial" && type === "building")) return "office";
  if (category === "transport" || ["station", "airport", "bus_stop"].includes(type)) return "transit";
  if (category === "amenity" && ["cafe", "restaurant", "bar"].includes(type)) return "café";
  if (category === "leisure" || category === "natural") return "outdoor";
  if (road.toLowerCase().includes("market") || suburb.toLowerCase().includes("talat")) return "market";
  return "home";
}

// Map weather + GPS zone to emotion tag
export function inferEmotion(
  weatherCondition: string,
  temp: number,
  zone: string
): string {
  const condition = weatherCondition.toLowerCase();

  if (zone === "office") {
    if (condition.includes("clear") && temp > 25) return "focused";
    if (condition.includes("cloud") || condition.includes("overcast")) return "focused";
    return "stressed";
  }
  if (zone === "café") return "happy";
  if (zone === "transit") {
    return temp < 20 ? "nervous" : "curious";
  }
  if (zone === "outdoor") {
    if (condition.includes("rain")) return "relaxed";
    if (condition.includes("clear") && temp > 28) return "happy";
    return "relaxed";
  }
  if (zone === "market") return "excited";
  // home
  if (condition.includes("rain")) return "relaxed";
  return "focused";
}

async function fetchNominatim(lat: number, lng: number): Promise<Record<string, unknown> | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Kotoka/1.0 (kotoka.app)" } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return null; // rate-limited HTML error page
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lng: number): Promise<{ condition: string; temp: number } | null> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null; // covers 401 expired key
    const data = await res.json();
    return { condition: data.weather?.[0]?.main ?? "clear", temp: data.main?.temp ?? 25 };
  } catch {
    return null;
  }
}

async function geminiSensoryFallback(
  sceneContext: string,
  imageBase64?: string
): Promise<{ atmosphereTag: string }> {
  const prompt = `Given this scene: "${sceneContext}", return JSON { "atmosphereTag": "home|office|café|transit|outdoor|market" } based on the setting. Return JSON only, no markdown.`;
  try {
    const raw = imageBase64
      ? await zhipuVision(imageBase64, prompt)
      : await zhipuText([{ role: "user", content: prompt }]);
    const clean = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(clean);
    return { atmosphereTag: parsed.atmosphereTag ?? "home" };
  } catch {
    return { atmosphereTag: "home" };
  }
}

// Generate auto-tag from GPS+weather primary path, Gemini AI fallback
export async function generateAutoTag(
  sceneContext: string,
  lat?: number,
  lng?: number,
  imageBase64?: string
): Promise<AutoTagResult> {
  let atmosphereTag: string | null = null;
  let weatherRaw: { condition: string; temp: number } | undefined;
  let gpsZone: string | undefined;

  if (lat !== undefined && lng !== undefined) {
    try {
      const [nominatim, weather] = await Promise.all([
        fetchNominatim(lat, lng),
        fetchWeather(lat, lng),
      ]);
      if (nominatim) {
        gpsZone = gpsToZone(nominatim);
        atmosphereTag = gpsZone;
        if (weather) weatherRaw = weather;
        console.log("[autoSensoryTag] path=gps result=ok zone=%s", gpsZone);
      } else {
        console.warn("[autoSensoryTag] path=gps result=fail reason=partial_response");
      }
    } catch (e) {
      console.warn("[autoSensoryTag] path=gps result=fail error=", e);
    }
  }

  if (!atmosphereTag) {
    try {
      const fallback = await geminiSensoryFallback(sceneContext, imageBase64);
      atmosphereTag = fallback.atmosphereTag;
      console.log("[autoSensoryTag] path=gemini result=ok");
    } catch (e) {
      console.error("[autoSensoryTag] path=gemini result=fail error=", e);
      atmosphereTag = atmosphereTag ?? "home";
    }
  }

  // Emotion is NOT auto-detected — user picks it manually on the tag page
  const emotionTag = "";
  const compoundTag = atmosphereTag;
  const sound = getSoundForTags("", atmosphereTag);
  return {
    emotionTag,
    atmosphereTag,
    compoundTag,
    soundId: sound.id,
    soundName: sound.name,
    soundEmoji: sound.emoji,
    weatherRaw,
    gpsZone,
  };
}
