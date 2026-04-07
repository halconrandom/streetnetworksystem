import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

export const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function execute<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Types
export interface DBUser {
  id: string;
  clerk_id: string | null;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  discord_review_channel_id: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface DBUserFlag {
  user_id: string;
  flag: string;
  granted_by: string | null;
  created_at: Date;
}

export interface DBTicket {
  id: string;
  ticket_number: number;
  user_id: string;
  thread_id: string;
  category: string;
  status: string | null;
  claimed_by: string | null;
  created_at: Date;
  closed_at: Date | null;
  full_name: string | null;
  opened_by_name: string | null;
  active_project_name: string | null;
  bug_reported: string | null;
  support_needed: string | null;
  project_description: string | null;
  inquiry_description: string | null;
}

export interface DBAuditLog {
  id: number;
  actor_user_id: string | null;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  ip: string | null;
  user_agent: string | null;
}

export interface DBLiveUpdate {
  id: number;
  type: string;
  message: string;
  description: string | null;
  date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
