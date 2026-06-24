export const DEFAULT_CHAT_MODEL =
  process.env.AI_CHAT_MODEL ?? process.env.OPENROUTER_CHAT_MODEL ?? 'google/gemini-2.5-flash-lite';

export const QUALITY_CHAT_MODEL =
  process.env.AI_QUALITY_MODEL ?? process.env.OPENROUTER_QUALITY_MODEL ?? 'google/gemini-2.5-flash';
