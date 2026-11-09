/**
 * StayHome free-launch rules. Caps are also hardcoded in
 * migrations/20261109120000_stayhome_free_launch.sql and must stay in sync.
 * Kelviq checkout stays closed: in-home audits, when they exist, are Stripe
 * Connect charges, not a Kelviq plan.
 */

export const PINNED_FLASH_LITE_MODEL = 'google/gemini-2.5-flash-lite';

export const AI_FINDINGS_MAX_COUNT = 50;
export const AI_FINDING_MAX_CHARS = 500;
export const AI_CONTEXT_MAX_CHARS = 120;
export const AI_RUNS_PER_COMPLETED_AUDIT = 3;
export const AI_RUNS_PER_FAMILY_MONTH = 5;

export const AUTH_EMAIL_PER_HOUR = 5;
export const AUTH_EMAIL_PER_MONTH = 10;

/** Paid Kelviq checkout is not part of this launch. */
export const KELVIQ_CHECKOUT_OPEN = false;

const PAID_PLAN_CODES = new Set(['pro']);

export type LaunchBillingStatus =
  | 'basic'
  | 'pending'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled';

export function isPaidPlanCode(planCode: string) {
  return PAID_PLAN_CODES.has(planCode);
}

export function isPaidStatus(status: LaunchBillingStatus) {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

/**
 * Free launch never applies a Kelviq event that would grant paid access.
 * Cancellations still apply so an existing subscription can end.
 */
export function shouldApplyKelviqEntitlement(input: {
  isCancellation: boolean;
  planCode?: string;
  status: LaunchBillingStatus | null;
}): boolean {
  if (input.isCancellation) return true;
  if (!KELVIQ_CHECKOUT_OPEN) {
    if (input.planCode && isPaidPlanCode(input.planCode)) return false;
    if (input.status && isPaidStatus(input.status)) return false;
  }
  return true;
}

const AUDIT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AuditSummaryRequest = {
  auditId: string;
  findings: string[];
  propertyType?: string;
  seniorName?: string;
};

export function validateAuditSummaryRequest(
  body: unknown,
): { ok: true; value: AuditSummaryRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request.' };
  }
  const record = body as Record<string, unknown>;
  if (typeof record.auditId !== 'string' || !AUDIT_ID_RE.test(record.auditId)) {
    return { ok: false, error: 'A valid auditId is required.' };
  }

  if (!Array.isArray(record.findings) || record.findings.length === 0) {
    return { ok: false, error: 'findings is required' };
  }
  if (record.findings.length > AI_FINDINGS_MAX_COUNT) {
    return { ok: false, error: `At most ${AI_FINDINGS_MAX_COUNT} findings are allowed.` };
  }

  const findings: string[] = [];
  for (const item of record.findings) {
    if (typeof item !== 'string') {
      return { ok: false, error: 'Each finding must be text.' };
    }
    const text = item.trim();
    if (!text) {
      return { ok: false, error: 'Findings cannot be empty.' };
    }
    if ([...text].length > AI_FINDING_MAX_CHARS) {
      return {
        ok: false,
        error: `Each finding must be ${AI_FINDING_MAX_CHARS} characters or fewer.`,
      };
    }
    findings.push(text);
  }

  const propertyType = optionalShortText(record.propertyType, 'propertyType');
  if (propertyType && !propertyType.ok) return propertyType;
  const seniorName = optionalShortText(record.seniorName, 'seniorName');
  if (seniorName && !seniorName.ok) return seniorName;

  return {
    ok: true,
    value: {
      auditId: record.auditId,
      findings,
      propertyType: propertyType?.ok ? propertyType.value : undefined,
      seniorName: seniorName?.ok ? seniorName.value : undefined,
    },
  };
}

function optionalShortText(
  value: unknown,
  label: string,
): { ok: true; value?: string } | { ok: false; error: string } | null {
  if (value == null) return null;
  if (typeof value !== 'string') {
    return { ok: false, error: `${label} must be text.` };
  }
  const text = value.trim();
  if (!text) return { ok: true };
  if ([...text].length > AI_CONTEXT_MAX_CHARS) {
    return { ok: false, error: `${label} must be ${AI_CONTEXT_MAX_CHARS} characters or fewer.` };
  }
  return { ok: true, value: text };
}

export type AuditAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export function validateAuditAddress(
  input: { street: string; city: string; state: string; zip: string },
): { ok: true; value: AuditAddress } | { ok: false; error: string } {
  const street = input.street.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  const zip = input.zip.trim();

  if (!street || !city || !state || !zip) {
    return { ok: false, error: 'Street, city, state, and ZIP are required.' };
  }
  if (street.length > 200 || city.length > 80) {
    return { ok: false, error: 'Address is too long.' };
  }
  if (!/^[A-Z]{2}$/.test(state)) {
    return { ok: false, error: 'State must be a 2-letter code.' };
  }
  if (!/^\d{5}(?:-\d{4})?$/.test(zip)) {
    return { ok: false, error: 'ZIP must be 5 digits or ZIP+4.' };
  }

  return { ok: true, value: { street, city, state, zip } };
}

export function familyAuditStatusLabel(status: string, assessorId: string | null): string {
  if (!assessorId && status === 'scheduled') return 'Requested';
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'scheduled') return 'Scheduled';
  return status;
}

export function familyAuditPackageLabel(assessorId: string | null, packageName: string): string {
  if (!assessorId) return 'Audit request';
  return packageName;
}
