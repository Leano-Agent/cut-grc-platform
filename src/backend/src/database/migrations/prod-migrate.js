// Production migration runner — runs on Railway startup
// Uses only `pg` (production dependency — no ts-node needed)
// Place in src/database/migrations/prod-migrate.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Ensure migrations table
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query('SELECT name FROM _migrations');
  const done = new Set(rows.map(r => r.name));

  for (const f of files) {
    if (done.has(f)) { console.log('  →', f, '(already applied)'); continue; }
    console.log('  ✓', f);
    const sql = fs.readFileSync(path.join(__dirname, f), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [f]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }

  console.log('Migrations complete');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
