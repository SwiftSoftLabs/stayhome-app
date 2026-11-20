import { clearAuthCookies } from '@/lib/auth/cookies';
import { query as authQuery } from '@/lib/auth/db';
import { requireAuthUser } from '@/lib/auth/api-guard';
import { query } from '@/lib/db';
import { cancelKelviqSubscription } from '@/lib/kelviq.server';
import type { UserSubscriptionRecord } from '@/types/billing';

async function bestEffort(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[account/delete] ${label}:`, err);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthUser(request);
    const userId = user.id;

    let body: { confirm?: string } = {};
    try {
      body = (await request.json()) as { confirm?: string };
    } catch {
      body = {};
    }
    if (String(body.confirm ?? '') !== 'DELETE') {
      return Response.json(
        { error: 'Send confirm: "DELETE" to permanently delete this account.' },
        { status: 400 },
      );
    }

    // Fail-closed Kelviq cancel when a paid subscription id exists.
    const subResult = await query<UserSubscriptionRecord>(
      `SELECT * FROM user_subscriptions WHERE user_id = $1`,
      [userId],
    );
    const subscription = subResult.rows[0];
    if (subscription?.kelviq_subscription_id && !subscription.is_manual) {
      await cancelKelviqSubscription(subscription.kelviq_subscription_id, {
        cancellationType: 'IMMEDIATE',
      });
    }

    // App domain rows (InsForge tables in app_stayhome) — best-effort; may not CASCADE from users.
    await bestEffort('jobs', async () => {
      await query(`DELETE FROM jobs WHERE family_id = $1 OR contractor_id = $1`, [userId]);
    });
    await bestEffort('leads', async () => {
      await query(`DELETE FROM leads WHERE family_id = $1 OR contractor_id = $1`, [userId]);
    });
    await bestEffort('reports', async () => {
      await query(`DELETE FROM reports WHERE family_id = $1`, [userId]);
    });
    await bestEffort('audit_findings', async () => {
      await query(
        `DELETE FROM audit_findings WHERE audit_id IN (
           SELECT id FROM audits WHERE family_id = $1 OR assessor_id = $1
         )`,
        [userId],
      );
    });
    await bestEffort('audits', async () => {
      await query(`DELETE FROM audits WHERE family_id = $1 OR assessor_id = $1`, [userId]);
    });
    await bestEffort('properties', async () => {
      await query(`DELETE FROM properties WHERE owner_id = $1`, [userId]);
    });
    await bestEffort('contractor_profiles', async () => {
      await query(`DELETE FROM contractor_profiles WHERE id = $1`, [userId]);
    });
    await bestEffort('notifications', async () => {
      await query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
    });
    await bestEffort('ai_usage', async () => {
      await query(`DELETE FROM ai_usage WHERE family_id = $1`, [userId]);
    });
    await bestEffort('billing_events', async () => {
      await query(`DELETE FROM billing_events WHERE owner_id = $1`, [userId]);
    });
    await bestEffort('user_subscriptions', async () => {
      await query(`DELETE FROM user_subscriptions WHERE user_id = $1`, [userId]);
    });
    await bestEffort('billing_customers', async () => {
      await query(`DELETE FROM billing_customers WHERE user_id = $1`, [userId]);
    });
    await bestEffort('profiles', async () => {
      await query(`DELETE FROM profiles WHERE id = $1`, [userId]);
    });

    // Canonical JWT owner — cascades auth_sessions / oauth / mfa / codes / passkeys.
    const deleted = await authQuery<{ id: string }>(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [userId],
    );
    if (!deleted.length) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    await clearAuthCookies();
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return Response.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    console.error('[account/delete]', error);
    if (error instanceof Error && error.message === 'KELVIQ_UNAVAILABLE') {
      return Response.json(
        { error: 'Unable to cancel billing before deleting the account. Try again later.' },
        { status: 503 },
      );
    }
    return Response.json({ error: 'Account deletion failed.' }, { status: 500 });
  }
}
