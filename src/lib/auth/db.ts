import { Pool, type QueryResultRow } from 'pg';
import { authConfig } from './config';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const sslEnabled = process.env.DATABASE_SSL === 'true';
    pool = new Pool({
      connectionString: authConfig.databaseUrl(),
      ssl: sslEnabled
        ? {
            rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : undefined,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    await client.query(`SET search_path TO ${authConfig.schema}, public`);
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
