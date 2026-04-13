export interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  url: string;
  tags: string[];
}

export const SOUND_LIBRARY: Record<string, AmbientSound> = {
  S01: {
    id: "S01",
    name: "Office Hum",
    emoji: "💼",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_72c081b5b0.mp3",
    tags: ["office", "focused", "work"],
  },
  S02: {
    id: "S02",
    name: "Keyboard Clicks",
    emoji: "⌨️",
    url: "https://cdn.pixabay.com/audio/2022/11/17/audio_4c8b2dcaa9.mp3",
    tags: ["office", "stressed", "typing"],
  },
  S03: {
    id: "S03",
    name: "Café Chatter",
    emoji: "☕",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    tags: ["café", "happy", "social"],
  },
  S04: {
    id: "S04",
    name: "City Traffic",
    emoji: "🚗",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_8cbee96f90.mp3",
    tags: ["transit", "outdoor", "city"],
  },
  S05: {
    id: "S05",
    name: "BTS Station",
    emoji: "🚇",
    url: "https://cdn.pixabay.com/audio/2021/08/09/audio_88447a4e36.mp3",
    tags: ["transit", "nervous", "crowd"],
  },
  S06: {
    id: "S06",
    name: "Rain on Window",
    emoji: "🌧️",
    url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257107d959.mp3",
    tags: ["home", "relaxed", "cozy"],
  },
  S07: {
    id: "S07",
    name: "Park Birds",
    emoji: "🐦",
    url: "https://cdn.pixabay.com/audio/2021/10/19/audio_6b6b97f5b7.mp3",
    tags: ["outdoor", "happy", "nature"],
  },
  S08: {
    id: "S08",
    name: "Ocean Waves",
    emoji: "🌊",
    url: "https://cdn.pixabay.com/audio/2022/06/07/audio_b9f00de4a0.mp3",
    tags: ["outdoor", "relaxed", "calm"],
  },
  S09: {
    id: "S09",
    name: "Market Bustle",
    emoji: "🛒",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_72c081b5b0.mp3",
    tags: ["market", "excited", "busy"],
  },
  S10: {
    id: "S10",
    name: "Airport Terminal",
    emoji: "✈️",
    url: "https://cdn.pixabay.com/audio/2021/08/09/audio_88447a4e36.mp3",
    tags: ["transit", "curious", "travel"],
  },
  S11: {
    id: "S11",
    name: "Meeting Room",
    emoji: "🏛️",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_72c081b5b0.mp3",
    tags: ["office", "focused", "professional"],
  },
  S12: {
    id: "S12",
    name: "Night Crickets",
    emoji: "🌙",
    url: "https://cdn.pixabay.com/audio/2022/08/31/audio_d3a1e4f7e3.mp3",
    tags: ["outdoor", "tired", "night"],
  },
};

export const COMPOUND_SOUND_MAP: Record<string, string> = {
  "focused + office": "S01",
  "stressed + office": "S02",
  "happy + café": "S03",
  "tired + transit": "S04",
  "nervous + transit": "S05",
  "relaxed + home": "S06",
  "happy + outdoor": "S07",
  "relaxed + outdoor": "S08",
  "excited + market": "S09",
  "curious + transit": "S10",
  "focused + meeting": "S11",
  "tired + outdoor": "S12",
};

export function getSoundForTags(emotion: string, atmosphere: string): AmbientSound {
  const compound = `${emotion} + ${atmosphere}`;
  const soundId = COMPOUND_SOUND_MAP[compound]
    ?? Object.values(SOUND_LIBRARY).find(s => s.tags.includes(atmosphere))?.id
    ?? "S01";
  return SOUND_LIBRARY[soundId];
}

export function getAllSounds(): AmbientSound[] {
  return Object.values(SOUND_LIBRARY);
}
