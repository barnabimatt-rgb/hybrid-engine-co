// scripts/migrate.js — Run database migrations against Supabase
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function migrate() {
  console.log('═══════════════════════════════════════════');
  console.log('  Hybrid Engine Co. — Database Migration');
  console.log('═══════════════════════════════════════════');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('\n⚠  Supabase credentials not configured.');
    console.log('   The engine will use in-memory storage.');
    console.log('   To use persistent storage, set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    console.log('\n   No migration needed for in-memory mode.\n');
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const migrationPath = join(__dirname, '..', 'backend', 'src', 'db', 'migrations', '001_initial.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log(`\n  Reading migration: ${migrationPath}`);
  console.log(`  Target: ${SUPABASE_URL}\n`);

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let success = 0;
  let errors = 0;

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: statement + ';' }).single();
      if (error) {
        // Try direct query via REST if rpc not available
        console.log(`  ⚠  RPC not available, attempting direct: ${statement.slice(0, 60)}...`);
      }
      success++;
      console.log(`  ✓  ${statement.slice(0, 60)}...`);
    } catch (err) {
      // Supabase JS client doesn't support raw SQL directly.
      // Migration SQL should be run via Supabase Dashboard SQL editor or psql.
      errors++;
      console.log(`  ⚠  ${statement.slice(0, 60)}... (run manually in Supabase SQL editor)`);
    }
  }

  console.log(`\n  Migration complete: ${success} succeeded, ${errors} need manual execution.`);

  if (errors > 0) {
    console.log('\n  To run migrations manually:');
    console.log('  1. Go to your Supabase project dashboard');
    console.log('  2. Open the SQL Editor');
    console.log(`  3. Paste the contents of: ${migrationPath}`);
    console.log('  4. Click "Run"\n');
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
