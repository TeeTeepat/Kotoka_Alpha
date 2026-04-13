export interface ConversationExchange {
  role: "koko" | "user";
  message: string;
}

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetWords: string[];
  kokoPersonality: string;
  exchanges: ConversationExchange[];
}

export const conversationScenarios: ConversationScenario[] = [
  {
    id: "client-meeting",
    title: "Client Meeting",
    description: "Practice rescheduling, agendas, and proposals",
    emoji: "🏢",
    targetWords: ["agenda", "deadline", "proposal", "budget", "follow-up"],
    kokoPersonality: "Professional but friendly. Uses business language naturally.",
    exchanges: [
      { role: "koko", message: "Your client just arrived! They want to discuss today's agenda. What would you like to start with?" },
      { role: "user", message: "Let's start with the agenda. We need to cover the new proposal before the deadline." },
      { role: "koko", message: "Great suggestion! The client seems interested. They asked about the budget for Q3. Can you address that?" },
      { role: "user", message: "The budget looks good. I'll send a follow-up email after the meeting with the proposal details." },
      { role: "koko", message: "Excellent! The client is impressed. They'd like to know the timeline for the next steps." },
    ],
  },
  {
    id: "cafe-small-talk",
    title: "Café & Small Talk",
    description: "Practice recommending, describing, and chatting",
    emoji: "☕",
    targetWords: ["recommend", "atmosphere", "regular", "special", "ambience"],
    kokoPersonality: "Casual, warm café owner. Loves chatting about drinks.",
    exchanges: [
      { role: "koko", message: "Welcome to Cozy Corner Café! What can I get for you today?" },
      { role: "user", message: "What do you recommend? I love the atmosphere here." },
      { role: "koko", message: "Thank you! Our regular customers love the matcha latte. But today we have a special — lavender honey latte!" },
      { role: "user", message: "That sounds amazing! The ambience is so relaxing. I'll try the special." },
      { role: "koko", message: "Wonderful choice! Is there anything else you'd like? We just baked some croissants." },
    ],
  },
  {
    id: "airport-travel",
    title: "Airport & Travel",
    description: "Practice departure, transfers, and customs vocabulary",
    emoji: "✈️",
    targetWords: ["boarding", "departure", "gate", "customs", "luggage"],
    kokoPersonality: "Helpful airport staff. Patient with travelers.",
    exchanges: [
      { role: "koko", message: "Good morning! Welcome to Suvarnabhumi Airport. Can I see your boarding pass?" },
      { role: "user", message: "Here it is. When is boarding? And which gate is my departure?" },
      { role: "koko", message: "Your gate is C12. Boarding starts in 45 minutes. Do you have any luggage to check in?" },
      { role: "user", message: "Just this carry-on. Do I need to go through customs before the gate?" },
      { role: "koko", message: "Yes, customs is after security, before you reach the gate. You'll have plenty of time! Safe travels!" },
    ],
  },
];
