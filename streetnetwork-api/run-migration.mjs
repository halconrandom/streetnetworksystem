import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
    const sqlPath = path.join(process.cwd(), 'migrations', '004_vault.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('--- RUNNING MIGRATION: 004_vault.sql ---');
        await pool.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
