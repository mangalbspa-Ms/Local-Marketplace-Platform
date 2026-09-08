/**
 * PostgreSQL Database Adapter & Connection Pool Manager
 * 
 * Provides relational connection pooling, transaction execution,
 * and parameterized query wrappers for production environments.
 */

import pg from 'pg';
import { Logger } from '../utils/logger.ts';

const { Pool } = pg;

export class PostgresClient {
  private static pool: pg.Pool | null = null;
  private static isConnected: boolean = false;

  public static getPool(): pg.Pool | null {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        Logger.error('Unexpected PostgreSQL client error', err);
      });
    }

    return this.pool;
  }

  public static async query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
    const pool = this.getPool();
    if (!pool) {
      throw new Error('DATABASE_URL environment variable is not configured.');
    }
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 500) {
        Logger.warn(`Slow query executed in ${duration}ms`, { query: text });
      }
      return res;
    } catch (err: any) {
      Logger.error(`Database query failed: ${err.message}`, { query: text });
      throw err;
    }
  }

  public static async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    if (!pool) {
      throw new Error('DATABASE_URL environment variable is not configured.');
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public static async checkConnection(): Promise<boolean> {
    const pool = this.getPool();
    if (!pool) return false;
    try {
      const res = await pool.query('SELECT 1 as health_check');
      this.isConnected = res.rows.length > 0;
      return this.isConnected;
    } catch (err) {
      this.isConnected = false;
      return false;
    }
  }
}
