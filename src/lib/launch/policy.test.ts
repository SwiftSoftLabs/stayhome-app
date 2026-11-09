import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  AI_FINDING_MAX_CHARS,
  AI_FINDINGS_MAX_COUNT,
  AI_RUNS_PER_COMPLETED_AUDIT,
  AI_RUNS_PER_FAMILY_MONTH,
  AUTH_EMAIL_PER_HOUR,
  AUTH_EMAIL_PER_MONTH,
  KELVIQ_CHECKOUT_OPEN,
  familyAuditPackageLabel,
  familyAuditStatusLabel,
  shouldApplyKelviqEntitlement,
  validateAuditAddress,
  validateAuditSummaryRequest,
} from './policy.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

test('Kelviq checkout stays closed and paid grants are ignored', () => {
  assert.equal(KELVIQ_CHECKOUT_OPEN, false);
  assert.equal(
    shouldApplyKelviqEntitlement({ isCancellation: false, planCode: 'pro', status: 'active' }),
    false,
  );
  assert.equal(
    shouldApplyKelviqEntitlement({ isCancellation: false, planCode: 'pro', status: 'pending' }),
    false,
  );
  assert.equal(
    shouldApplyKelviqEntitlement({ isCancellation: false, status: 'past_due' }),
    false,
  );
  assert.equal(
    shouldApplyKelviqEntitlement({ isCancellation: true, planCode: 'pro', status: 'canceled' }),
    true,
  );
  assert.equal(
    shouldApplyKelviqEntitlement({ isCancellation: false, planCode: 'basic', status: 'basic' }),
    true,
  );
});

test('audit summary request rejects oversized findings and requires an audit id', () => {
  const missing = validateAuditSummaryRequest({ findings: ['Loose rug'] });
  assert.equal(missing.ok, false);

  const tooMany = validateAuditSummaryRequest({
    auditId: '11111111-1111-4111-8111-111111111111',
    findings: Array.from({ length: AI_FINDINGS_MAX_COUNT + 1 }, () => 'Step'),
  });
  assert.equal(tooMany.ok, false);

  const tooLong = validateAuditSummaryRequest({
    auditId: '11111111-1111-4111-8111-111111111111',
    findings: ['x'.repeat(AI_FINDING_MAX_CHARS + 1)],
  });
  assert.equal(tooLong.ok, false);

  const ok = validateAuditSummaryRequest({
    auditId: '11111111-1111-4111-8111-111111111111',
    findings: ['  Loose rug in the hall  '],
    propertyType: ' Single family ',
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.deepEqual(ok.value.findings, ['Loose rug in the hall']);
    assert.equal(ok.value.propertyType, 'Single family');
  }
});

test('audit address has no silent fallback', () => {
  const empty = validateAuditAddress({ street: '  ', city: '', state: '', zip: '' });
  assert.equal(empty.ok, false);
  const ok = validateAuditAddress({
    street: ' 10 Pine Street ',
    city: 'Austin',
    state: 'tx',
    zip: '78701',
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.street, '10 Pine Street');
    assert.equal(ok.value.state, 'TX');
  }
  const badZip = validateAuditAddress({
    street: '10 Pine Street',
    city: 'Austin',
    state: 'TX',
    zip: 'Oak',
  });
  assert.equal(badZip.ok, false);
});

test('unassigned scheduled audits are requests, not confirmed visits', () => {
  assert.equal(familyAuditStatusLabel('scheduled', null), 'Requested');
  assert.equal(familyAuditStatusLabel('scheduled', '11111111-1111-4111-8111-111111111111'), 'Scheduled');
  assert.equal(familyAuditPackageLabel(null, 'Basic'), 'Audit request');
});

test('free-launch migration deactivates pro and stores usage with a unique key', () => {
  const sql = read('migrations/20261109120000_stayhome_free_launch.sql');
  assert.match(sql, /SET active = false/);
  assert.match(sql, /kelviq_variant_id = NULL/);
  assert.match(sql, /CONSTRAINT ai_usage_family_audit_period_key UNIQUE \(family_id, audit_id, period_start\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS app_stayhome\.ai_usage/);
  assert.match(sql, /v_audit_runs >= 3/);
  assert.match(sql, /v_family_runs >= 5/);
  assert.match(sql, /hour_count >= 5/);
  assert.match(sql, /month_count >= 10/);
  assert.equal(AI_RUNS_PER_COMPLETED_AUDIT, 3);
  assert.equal(AI_RUNS_PER_FAMILY_MONTH, 5);
  assert.equal(AUTH_EMAIL_PER_HOUR, 5);
  assert.equal(AUTH_EMAIL_PER_MONTH, 10);
  assert.doesNotMatch(sql, /INSERT INTO app_stayhome\.user_subscriptions/i);
  assert.doesNotMatch(sql, /INSERT INTO app_stayhome\.billing_customers/i);
});

test('public copy and config do not advertise unbuilt paid offers', () => {
  const files = [
    'src/app/page.tsx',
    'src/app/pricing/page.tsx',
    'src/app/how-it-works/page.tsx',
    'src/app/book/page.tsx',
    'src/app/dashboard/assessor/earnings/page.tsx',
    'src/app/dashboard/contractor/payments/page.tsx',
    'src/app/dashboard/admin/payments/page.tsx',
    '.env.example',
    'scripts/kelviq-catalog.config.json',
  ];
  const combined = files.map((file) => read(file)).join('\n');
  for (const phrase of [
    '10,000',
    'Sarah M.',
    'James K.',
    'Linda T.',
    'licensed, insured',
    'background-checked',
    'AI-powered',
    'AI-Powered',
    '$199',
    '$25',
    '$49',
    '$45,000',
    '$300',
    '42 Oak Lane',
    'stayhome-pro',
  ]) {
    assert.equal(combined.includes(phrase), false, phrase);
  }
  const models = read('src/lib/ai/models.ts');
  assert.match(models, /QUALITY_CHAT_MODEL = PINNED_FLASH_LITE_MODEL/);
  assert.doesNotMatch(models, /process\.env/);
  assert.match(read('src/lib/launch/policy.ts'), /google\/gemini-2.5-flash-lite/);
  assert.match(read('.env.example'), /AI_QUALITY_MODEL=google\/gemini-2.5-flash-lite/);
  assert.match(read('.env.example'), /KELVIQ_VARIANT_PRO=\s*$/m);
  assert.match(read('.env.example'), /BILLING_PRE_LAUNCH=true/);
  const catalog = JSON.parse(read('scripts/kelviq-catalog.config.json')) as { plans: unknown[] };
  assert.deepEqual(catalog.plans, []);
});
