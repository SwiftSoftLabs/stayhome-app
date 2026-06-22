import crypto from 'node:crypto';

const KELVIQ_API_BASE_URL = process.env.KELVIQ_API_BASE_URL || '';
const KELVIQ_API_KEY = process.env.KELVIQ_API_KEY || '';
const KELVIQ_WEBHOOK_SECRET = process.env.KELVIQ_WEBHOOK_SECRET || '';

async function kelviqFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!KELVIQ_API_BASE_URL || !KELVIQ_API_KEY) {
    throw new Error('KELVIQ_UNAVAILABLE');
  }

  const url = `${KELVIQ_API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KELVIQ_API_KEY}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable)');
    console.error(`[kelviq] ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
    throw new Error('KELVIQ_UNAVAILABLE');
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function getKelviqVariantId(planCode: string): string {
  if (planCode === 'pro') return process.env.KELVIQ_VARIANT_PRO || '';
  return '';
}

type KelviqCustomerRecord = {
  id: string;
  customerId?: string;
  email?: string | null;
};

type KelviqCustomerList = {
  results?: KelviqCustomerRecord[];
};

function kelviqFieldAlreadyExists(value: unknown) {
  return Array.isArray(value) && value.some(
    (message) => typeof message === 'string' && message.toLowerCase().includes('already exists'),
  );
}

function mapKelviqCustomerRecord(record: KelviqCustomerRecord) {
  const externalId = record.customerId ?? record.id;
  return {
    data: {
      id: externalId,
      customer_id: externalId,
      internal_id: record.id,
      portal_customer_id: record.customerId ?? null,
    },
  };
}

async function findKelviqCustomer(input: { externalCustomerId: string; email: string }) {
  const byEmail = await kelviqFetch(
    `/customers/?search=${encodeURIComponent(input.email)}`,
  ) as KelviqCustomerList;
  const emailMatch = byEmail.results?.find(
    (record) =>
      typeof record.email === 'string'
      && record.email.toLowerCase() === input.email.toLowerCase(),
  ) ?? byEmail.results?.[0];
  if (emailMatch?.id) {
    return mapKelviqCustomerRecord(emailMatch);
  }

  const byExternalId = await kelviqFetch(
    `/customers/?customerId=${encodeURIComponent(input.externalCustomerId)}`,
  ) as KelviqCustomerList;
  const externalMatch = byExternalId.results?.find(
    (record) =>
      record.customerId === input.externalCustomerId
      || record.id === input.externalCustomerId,
  );
  if (externalMatch?.id) {
    return mapKelviqCustomerRecord(externalMatch);
  }

  return null;
}

export async function createKelviqCustomer(input: {
  email: string;
  externalCustomerId: string;
  name?: string | null;
}) {
  const url = `${KELVIQ_API_BASE_URL}/customers/`;
  if (!KELVIQ_API_BASE_URL || !KELVIQ_API_KEY) throw new Error('KELVIQ_UNAVAILABLE');

  const res = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KELVIQ_API_KEY}`,
    },
    body: JSON.stringify({
      customerId: input.externalCustomerId,
      email: input.email,
      name: input.name || undefined,
    }),
  });

  const bodyText = await res.text().catch(() => '');

  if (res.ok) {
    const data = (bodyText ? JSON.parse(bodyText) : {}) as { id: string; customerId?: string };
    const externalId = data.customerId ?? data.id;
    return {
      data: {
        id: externalId,
        customer_id: externalId,
        internal_id: data.id,
        portal_customer_id: data.customerId ?? null,
      },
    };
  }

  if (res.status === 400) {
    const errBody = (bodyText ? JSON.parse(bodyText) : {}) as Record<string, unknown>;
    const duplicateCustomer =
      kelviqFieldAlreadyExists(errBody.customerId)
      || kelviqFieldAlreadyExists(errBody.email);

    if (duplicateCustomer) {
      const existing = await findKelviqCustomer(input);
      if (existing) return existing;
    }
  }

  console.error(`[kelviq] POST /customers/ → ${res.status}: ${bodyText || '(empty)'}`);
  throw new Error('KELVIQ_UNAVAILABLE');
}

export async function createKelviqCheckout(input: {
  variantId: string;
  customerId: string;
  internalCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const data = await kelviqFetch('/checkout/', {
    method: 'POST',
    body: JSON.stringify({
      planIdentifier: input.variantId,
      chargePeriod: 'MONTHLY',
      customerId: input.internalCustomerId || input.customerId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    }),
  }) as { checkoutUrl?: string; url?: string };

  return { data: { checkoutUrl: data.checkoutUrl, url: data.url } };
}

export async function createKelviqPortal(input: { customerId: string }) {
  const data = await kelviqFetch('/portal/session/', {
    method: 'POST',
    body: JSON.stringify({ customerId: input.customerId }),
  }) as { customerPortalUrl?: string; token?: string };

  if (!data.customerPortalUrl || !data.token) throw new Error('KELVIQ_UNAVAILABLE');
  const sep = data.customerPortalUrl.includes('?') ? '&' : '?';
  const url = `${data.customerPortalUrl}${sep}token=${encodeURIComponent(data.token)}`;
  return { data: { url, portalUrl: url } };
}

export type KelviqCancellationType = 'IMMEDIATE' | 'CURRENT_PERIOD_ENDS' | 'SPECIFIC_DATE';

export async function cancelKelviqSubscription(
  subscriptionId: string,
  options: { cancellationType: KelviqCancellationType },
): Promise<void> {
  await kelviqFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ cancellationType: options.cancellationType }),
  });
}

export function verifyKelviqWebhookSignature(rawBody: string, headers: Headers) {
  if (!KELVIQ_WEBHOOK_SECRET) {
    throw new Error('KELVIQ_UNAVAILABLE');
  }

  const webhookId = headers.get('webhook-id');
  const webhookTimestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');

  if (!webhookId || !webhookTimestamp || !signatureHeader) {
    return false;
  }

  const timestampMs = Number(webhookTimestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', KELVIQ_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  const [, provided] = signatureHeader.split(',');
  if (!provided || provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
