import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';

const DEFAULT_CHAT_MODEL = 'google/gemini-2.5-flash-lite';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured. Run: npx @insforge/cli ai setup');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}

export function getChatModel(override?: string): string {
  return (
    override?.trim() ||
    process.env.OPENROUTER_CHAT_MODEL?.trim() ||
    process.env.AI_CHAT_MODEL?.trim() ||
    DEFAULT_CHAT_MODEL
  );
}

export function getEmbeddingModel(override?: string): string {
  return (
    override?.trim() ||
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() ||
    process.env.AI_EMBEDDING_MODEL?.trim() ||
    DEFAULT_EMBEDDING_MODEL
  );
}

export type OpenRouterChatOptions = {
  model?: string;
  messages: ChatCompletionMessageParam[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
  stream?: false;
};

export type OpenRouterStreamOptions = Omit<OpenRouterChatOptions, 'stream'> & { stream: true };

function buildMessages(options: Pick<OpenRouterChatOptions, 'messages' | 'systemPrompt'>) {
  const systemPrompt = options.systemPrompt?.trim();
  if (!systemPrompt) return options.messages;
  const withoutSystem =
    options.messages[0]?.role === 'system' ? options.messages.slice(1) : options.messages;
  return [{ role: 'system' as const, content: systemPrompt }, ...withoutSystem];
}

export async function createChatCompletion(
  options: OpenRouterChatOptions,
): Promise<ChatCompletion> {
  const client = getOpenRouterClient();
  const params: ChatCompletionCreateParamsNonStreaming = {
    model: getChatModel(options.model),
    messages: buildMessages(options),
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream: false,
  };
  if (options.responseFormat) {
    params.response_format = options.responseFormat;
  }
  return client.chat.completions.create(params);
}

export async function createChatCompletionStream(
  options: OpenRouterStreamOptions,
): Promise<AsyncIterable<ChatCompletionChunk>> {
  const client = getOpenRouterClient();
  const params: ChatCompletionCreateParamsStreaming = {
    model: getChatModel(options.model),
    messages: buildMessages(options),
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream: true,
  };
  if (options.responseFormat) {
    params.response_format = options.responseFormat;
  }
  return client.chat.completions.create(params);
}

export async function createEmbedding(input: string, model?: string) {
  const client = getOpenRouterClient();
  const response = await client.embeddings.create({
    model: getEmbeddingModel(model),
    input: input.slice(0, 8000),
  });
  return response;
}

export async function generateImage(options: {
  model?: string;
  prompt: string;
  size?: string;
}) {
  const client = getOpenRouterClient();
  const imageModel =
    options.model?.trim() ||
    process.env.OPENROUTER_IMAGE_MODEL?.trim() ||
    'google/gemini-2.5-flash-image';

  return client.images.generate({
    model: imageModel,
    prompt: options.prompt,
    size: (options.size as '1024x1024' | undefined) ?? '1024x1024',
  });
}

/** Legacy InsForge SDK-shaped response for drop-in route migrations */
export async function createLegacyChatPayload(options: OpenRouterChatOptions) {
  const completion = await createChatCompletion(options);
  const text = completion.choices[0]?.message?.content ?? '';
  return {
    success: true,
    text,
    choices: completion.choices,
    model: completion.model,
    usage: completion.usage,
    metadata: {
      model: completion.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : null,
    },
  };
}
