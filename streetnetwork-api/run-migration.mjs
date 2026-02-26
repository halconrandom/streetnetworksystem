import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
    const filename = process.argv[2] || '004_vault.sql';
    const sqlPath = path.join(process.cwd(), 'migrations', filename);

    if (!fs.existsSync(sqlPath)) {
        console.error(`Migration file not found: ${sqlPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log(`--- RUNNING MIGRATION: ${filename} ---`);
        await pool.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
