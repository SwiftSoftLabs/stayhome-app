import { createChatCompletion, createChatCompletionStream, createEmbedding, generateImage } from '../../../../../../lib/ai/openrouter';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { aiErrorResponse } from '@/lib/ai/errors';
import { getServiceInsforgeClient } from '@/lib/insforge-server';

export async function GET() {
  try {
    const client = getServiceInsforgeClient();
    const completion = await createChatCompletion({
      model: DEFAULT_CHAT_MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      maxTokens: 10,
      temperature: 0,
      stream: false,
    });
    return Response.json({
      ok: true,
      model: DEFAULT_CHAT_MODEL,
      content: completion.choices?.[0]?.message?.content?.trim() ?? '',
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
