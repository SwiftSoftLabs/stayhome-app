import { PINNED_FLASH_LITE_MODEL } from '@/lib/launch/policy';

/** Pinned. AI_CHAT_MODEL and AI_QUALITY_MODEL cannot select a larger model. */
export const DEFAULT_CHAT_MODEL = PINNED_FLASH_LITE_MODEL;

/** Pinned. Audit summaries always use Flash-Lite. */
export const QUALITY_CHAT_MODEL = PINNED_FLASH_LITE_MODEL;
