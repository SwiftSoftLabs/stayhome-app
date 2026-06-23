import { createChatCompletion, createChatCompletionStream, createEmbedding, generateImage } from '../../../../../../lib/ai/openrouter';
import { QUALITY_CHAT_MODEL } from '@/lib/ai/models';
import { aiErrorResponse } from '@/lib/ai/errors';
import { getBearerToken, getServiceInsforgeClient } from '@/lib/insforge-server';

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      findings?: string[];
      propertyType?: string;
      seniorName?: string;
    };

    if (!body.findings?.length) {
      return Response.json({ error: 'findings is required' }, { status: 400 });
    }

    const client = getServiceInsforgeClient(token);
    const completion = await createChatCompletion({
      model: QUALITY_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Summarize home safety audit findings for a family member. Use calm, clear language. 3-5 bullet points with priority order.',
        },
        {
          role: 'user',
          content: `Property: ${body.propertyType ?? 'Single-family home'}. Senior: ${body.seniorName ?? 'Resident'}.\n\nFindings:\n${body.findings.join('\n')}`,
        },
      ],
      maxTokens: 600,
      temperature: 0.3,
      stream: false,
    });

    return Response.json({
      content: completion.choices?.[0]?.message?.content?.trim() ?? '',
      model: QUALITY_CHAT_MODEL,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
