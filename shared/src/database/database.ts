import { Pool, PoolConfig } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "messages",
      user: process.env.POSTGRES_USER || "app",
      password: process.env.POSTGRES_PASSWORD || "app",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    pool = new Pool(config);
  }
  return pool;
}

export class Database {
  private pool: Pool;

  constructor(poolConfig?: PoolConfig) {
    if (poolConfig) {
      this.pool = new Pool(poolConfig);
    } else {
      this.pool = getPool();
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }

  async close(): Promise<void> {
    await this.pool.end();
    if (pool === this.pool) {
      pool = null;
    }
  }
}

export const db = new Database();

export async function closeDatabase(): Promise<void> {
  await db.close();
}
