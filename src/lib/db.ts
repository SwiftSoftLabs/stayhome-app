import { Pool, type PoolConfig, type QueryResultRow } from 'pg';

export const SCHEMA = process.env.NEXT_PUBLIC_DB_SCHEMA || 'app_stayhome';

let pool: Pool | null = null;

function resolveSsl(databaseUrl: string): PoolConfig['ssl'] {
  if (process.env.DATABASE_SSL === 'false') return undefined;
  if (process.env.DATABASE_SSL === 'true') {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  try {
    const host = new URL(databaseUrl).hostname;
    if (host.includes('insforge.app') || host.includes('neon.tech') || host.includes('supabase')) {
      return { rejectUnauthorized: false };
    }
  } catch {
    // fall through
  }

  return undefined;
}

export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set.');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: resolveSsl(databaseUrl),
      options: `-c search_path=${SCHEMA}`,
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });

    pool.on('error', (err) => {
      console.error('[db] idle pool error', err.message);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const result = await getPool().query<T>(text, params);
  return result;
}

export function buildSet(data: Record<string, unknown>, startIdx = 1) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const clause = entries.map(([key], index) => `${key} = $${startIdx + index}`).join(', ');
  const params = entries.map(([, value]) => value);
  return { clause, params, nextIdx: startIdx + entries.length };
}
