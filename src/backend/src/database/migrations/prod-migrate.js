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
    .filter(f => f.endsWith('.sql') && (f.startsWith('003') || f.startsWith('004')))
    .sort();

  const { rows } = await pool.query('SELECT name FROM _migrations');
  const done = new Set(rows.map(r => r.name));

  for (const f of files) {
    if (done.has(f)) { console.log('  →', f, '(already applied)'); continue; }
    console.log('  ✓', f);
    const sql = fs.readFileSync(path.join(__dirname, f), 'utf8');
    // SQL file handles its own transaction with BEGIN/COMMIT
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [f]);
    console.log('  → applied');
  }

  console.log('Migrations complete');
  await pool.end();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
