import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || '34.236.107.120',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      user: process.env.DB_USER || 'unicampus',
      password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
      database: process.env.DB_NAME || 'unicampus_erp',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function queryDb<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}
