import { aiErrorResponse } from '@/lib/ai/errors';
import { QUALITY_CHAT_MODEL } from '@/lib/ai/models';
import { createChatCompletion } from '@/lib/ai/openrouter';
import { readVerifiedAccessToken } from '@/lib/auth/api-guard';
import { query } from '@/lib/db';
import { validateAuditSummaryRequest } from '@/lib/launch/policy';

export const runtime = 'nodejs';

type AuditRow = {
  id: string;
  family_id: string;
  assessor_id: string | null;
  status: string;
};

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function capMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('AI_AUDIT_CAP')) {
    return 'This completed audit has used its 3 AI summaries.';
  }
  if (message.includes('AI_FAMILY_CAP')) {
    return 'This family has used its 5 AI summaries for the month.';
  }
  return null;
}

function isMissingRelation(error: unknown) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: string }).code === '42P01',
  );
}

export async function POST(request: Request) {
  let payload;
  try {
    payload = await readVerifiedAccessToken(request);
  } catch {
    return jsonError('Unauthorized', 401);
  }

  if (!payload.sub || !payload.sid || payload.type !== 'access') {
    return jsonError('Unauthorized', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request.', 400);
  }

  const parsed = validateAuditSummaryRequest(body);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400);
  }

  const session = await query<{ id: string }>(
    `SELECT s.id
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.user_id = $2
       AND s.revoked_at IS NULL
       AND s.expires_at > now()`,
    [payload.sid, payload.sub],
  );
  if (!session.rows[0]) {
    return jsonError('Unauthorized', 401);
  }

  let audit: AuditRow | undefined;
  try {
    const auditResult = await query<AuditRow>(
      `SELECT id, family_id, assessor_id, status
       FROM audits
       WHERE id = $1`,
      [parsed.value.auditId],
    );
    audit = auditResult.rows[0];
  } catch (error) {
    if (isMissingRelation(error)) {
      return jsonError('Audit records are unavailable.', 503);
    }
    console.error('[ai/audit-summary] audit lookup failed');
    return jsonError('AI request failed. Please try again.', 500);
  }

  if (!audit || audit.assessor_id !== payload.sub) {
    return jsonError('Audit not found.', 404);
  }
  if (audit.status !== 'completed') {
    return jsonError('AI summary is available after the audit is completed.', 409);
  }

  let periodStart: string | null = null;
  try {
    const reserved = await query<{ period_start: string; runs: number }>(
      `SELECT period_start::text AS period_start, runs
       FROM reserve_ai_summary_run($1, $2)`,
      [audit.family_id, audit.id],
    );
    periodStart = reserved.rows[0]?.period_start ?? null;
    if (!periodStart) {
      return jsonError('AI request failed. Please try again.', 500);
    }
  } catch (error) {
    const limited = capMessage(error);
    if (limited) return jsonError(limited, 429);
    if (isMissingRelation(error) || (error instanceof Error && error.message.includes('reserve_ai_summary_run'))) {
      return jsonError('AI summaries are temporarily unavailable.', 503);
    }
    console.error('[ai/audit-summary] quota reserve failed');
    return jsonError('AI summaries are temporarily unavailable.', 503);
  }

  try {
    const completion = await createChatCompletion({
      model: QUALITY_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Summarize home safety audit findings for a family member. Use calm, clear language. 3-5 bullet points with priority order. Do not invent findings.',
        },
        {
          role: 'user',
          content: `Property: ${parsed.value.propertyType ?? 'Home'}. Resident: ${parsed.value.seniorName ?? 'Resident'}.\n\nFindings:\n${parsed.value.findings.join('\n')}`,
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
    await query(
      `SELECT release_ai_summary_run($1, $2, $3::date)`,
      [audit.family_id, audit.id, periodStart],
    ).catch(() => {
      console.error('[ai/audit-summary] quota release failed');
    });
    return aiErrorResponse(error);
  }
}
