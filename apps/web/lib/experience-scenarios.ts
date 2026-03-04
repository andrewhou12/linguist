export interface ExperienceScenario {
  id: string
  emoji: string
  title: string
  subtitle: string
  category: ScenarioCategory
  prompt: string
}

export type ScenarioCategory =
  | 'featured'
  | 'conversations'
  | 'situations'
  | 'work'
  | 'social'
  | 'learn'
  | 'culture'
  | 'creative'

export const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  featured: 'Featured',
  conversations: 'Conversations',
  situations: 'Situations',
  work: 'Work & Formal',
  social: 'Social',
  learn: 'Learn',
  culture: 'Culture',
  creative: 'Creative',
}

export const SCENARIOS: ExperienceScenario[] = [
  // Conversations
  {
    id: 'just-chat',
    emoji: '\u{1F4AC}',
    title: 'Just Chat',
    subtitle: 'Casual conversation about anything',
    category: 'conversations',
    prompt: "Let's have a casual conversation. Talk about anything — my day, your day, whatever comes up naturally.",
  },
  {
    id: 'weekend-plans',
    emoji: '\u{1F5D3}',
    title: 'Weekend Plans',
    subtitle: 'Talk about what you did or will do',
    category: 'conversations',
    prompt: "Let's talk about weekend plans — what I did last weekend or what I'm planning to do.",
  },
  {
    id: 'hobby-talk',
    emoji: '\u{1F3A8}',
    title: 'Hobby Talk',
    subtitle: 'Share interests and hobbies',
    category: 'conversations',
    prompt: "Let's have a conversation about hobbies and interests. Ask me about mine and share yours.",
  },
  {
    id: 'debate',
    emoji: '\u{1F4A1}',
    title: 'Friendly Debate',
    subtitle: 'Discuss opinions on a fun topic',
    category: 'conversations',
    prompt: "Let's have a friendly debate about something fun — pick an interesting topic and let's share our opinions.",
  },

  // Situations
  {
    id: 'convenience-store',
    emoji: '\u{1F3EA}',
    title: 'Convenience Store',
    subtitle: 'Quick stop at the konbini',
    category: 'situations',
    prompt: "I'm walking into a convenience store in Tokyo late at night. I need to grab a few things and maybe ask the clerk for help finding something.",
  },
  {
    id: 'ramen-shop',
    emoji: '\u{1F35C}',
    title: 'Ramen Shop',
    subtitle: 'Ordering your first bowl',
    category: 'situations',
    prompt: "I just walked into a small, crowded ramen shop in Osaka. There's a ticket vending machine at the entrance and a counter with a few seats open. I need to figure out how to order.",
  },
  {
    id: 'train-station',
    emoji: '\u{1F689}',
    title: 'Train Station',
    subtitle: 'Navigate the rail system',
    category: 'situations',
    prompt: "I'm at a busy train station in Japan, trying to figure out which platform to go to. I need to ask for directions and buy a ticket.",
  },
  {
    id: 'lost-kyoto',
    emoji: '\u{1F5FA}',
    title: 'Lost in Kyoto',
    subtitle: 'Find your way through the old city',
    category: 'situations',
    prompt: "I'm wandering through a quiet neighborhood in Kyoto and I'm a bit lost. I need to find my way to a famous temple but my phone is dead.",
  },
  {
    id: 'ryokan',
    emoji: '\u{1F3E8}',
    title: 'Ryokan Check-in',
    subtitle: 'Traditional inn experience',
    category: 'situations',
    prompt: "I've just arrived at a traditional ryokan in the countryside. I need to check in, understand the house rules, and figure out the onsen and dinner situation.",
  },

  // Work & Formal
  {
    id: 'job-interview',
    emoji: '\u{1F454}',
    title: 'Job Interview',
    subtitle: 'Practice formal Japanese',
    category: 'work',
    prompt: "I'm about to have a job interview at a Japanese company. Help me practice answering common interview questions using appropriate keigo.",
  },
  {
    id: 'office-first-day',
    emoji: '\u{1F4BC}',
    title: 'First Day at Work',
    subtitle: 'Meet your new coworkers',
    category: 'work',
    prompt: "It's my first day at a Japanese office. I need to introduce myself, meet my team, and navigate the social dynamics of the workplace.",
  },

  // Social
  {
    id: 'izakaya',
    emoji: '\u{1F37B}',
    title: 'Izakaya Night',
    subtitle: 'Drinks and conversation',
    category: 'social',
    prompt: "I'm at an izakaya with a group of Japanese friends and coworkers. We're ordering food and drinks and having a fun evening.",
  },
  {
    id: 'language-exchange',
    emoji: '\u{1F91D}',
    title: 'Language Exchange',
    subtitle: 'Meet a language partner',
    category: 'social',
    prompt: "I'm meeting someone at a cafe for a language exchange. They want to practice English and I want to practice Japanese. Let's have a natural bilingual conversation.",
  },

  // Learn
  {
    id: 'counters',
    emoji: '\u{1F522}',
    title: 'Counters Deep Dive',
    subtitle: 'Master Japanese counting',
    category: 'learn',
    prompt: "Teach me about Japanese counters. Start with the most common ones and give me practice exercises. Use lots of examples in context.",
  },
  {
    id: 'keigo-crash',
    emoji: '\u{1F393}',
    title: 'Keigo Crash Course',
    subtitle: 'Honorific speech essentials',
    category: 'learn',
    prompt: 'Teach me the basics of keigo (honorific speech). Cover the essential patterns I need for polite situations, with practical examples.',
  },
  {
    id: 'te-form',
    emoji: '\u{270D}',
    title: 'て-form Practice',
    subtitle: 'Conjugation drill',
    category: 'learn',
    prompt: 'Help me practice て-form conjugation. Start with the rules, then give me lots of practice with different verb groups.',
  },
  {
    id: 'particles',
    emoji: '\u{1F9E9}',
    title: 'Particles Explained',
    subtitle: 'は vs が and beyond',
    category: 'learn',
    prompt: 'Help me understand Japanese particles better. Focus on the tricky ones like は vs が, に vs で, and give me practice sentences.',
  },

  // Culture
  {
    id: 'seasonal',
    emoji: '\u{1F338}',
    title: 'Seasonal Greetings',
    subtitle: 'Time-aware expressions',
    category: 'culture',
    prompt: "Teach me about seasonal greetings and expressions in Japanese. What phrases are appropriate right now and how do seasons shape daily conversation?",
  },
  {
    id: 'gift-giving',
    emoji: '\u{1F381}',
    title: 'Gift Giving',
    subtitle: 'お中元, お歳暮 & more',
    category: 'culture',
    prompt: 'Teach me about the culture and language of gift giving in Japan — omiyage, ochugen, oseibo. What do I say when giving and receiving?',
  },

  // Creative
  {
    id: 'detective',
    emoji: '\u{1F575}',
    title: 'Detective Mystery',
    subtitle: 'Solve a case in Japanese',
    category: 'creative',
    prompt: "Let's do a detective mystery in Japanese. You set up a crime scene and give me clues. I'll ask questions and try to solve it.",
  },
  {
    id: 'ghost-story',
    emoji: '\u{1F47B}',
    title: 'Ghost Story',
    subtitle: 'A Japanese horror tale',
    category: 'creative',
    prompt: 'Tell me a Japanese ghost story (kaidan). Make it atmospheric and a bit creepy, with choices for me along the way.',
  },
  {
    id: 'cooking-class',
    emoji: '\u{1F373}',
    title: 'Cooking Class',
    subtitle: 'Learn a Japanese recipe',
    category: 'creative',
    prompt: "I'm in a Japanese cooking class. The instructor is teaching us how to make a traditional dish. Walk me through the recipe and let me interact with the instructor.",
  },
]

export const FEATURED_IDS = [
  'just-chat',
  'ramen-shop',
  'te-form',
  'izakaya',
  'ghost-story',
  'convenience-store',
]

export function getScenariosByCategory(category: ScenarioCategory): ExperienceScenario[] {
  if (category === 'featured') {
    return FEATURED_IDS.map((id) => SCENARIOS.find((s) => s.id === id)!).filter(Boolean)
  }
  return SCENARIOS.filter((s) => s.category === category)
}

export function getAllCategories(): ScenarioCategory[] {
  return ['featured', 'conversations', 'situations', 'work', 'social', 'learn', 'culture', 'creative']
}
