// scripts/seed.js — Seed initial data for the dashboard
import 'dotenv/config';
import { createLogger } from '../backend/src/utils/logger.js';
import getDB from '../backend/src/db/supabase.js';
import { generateId, now } from '../backend/src/utils/helpers.js';

const log = createLogger('seed');

async function seed() {
  console.log('═══════════════════════════════════════════');
  console.log('  Hybrid Engine Co. — Database Seed');
  console.log('═══════════════════════════════════════════');

  const db = getDB();
  console.log(`\n  Database mode: ${db.type}\n`);

  const niches = ['hybrid_fitness', 'data_science', 'data_driven_fitness', 'tactical_mindset', 'productivity'];
  const pipelineTypes = ['content', 'product', 'funnel', 'affiliate', 'marketplace', 'self_optimization'];
  const statuses = ['completed', 'completed', 'completed', 'degraded', 'completed'];

  // Seed pipeline runs
  console.log('  Seeding pipeline runs...');
  for (let i = 0; i < 5; i++) {
    const run = {
      id: generateId(),
      pipeline_type: pipelineTypes[i % pipelineTypes.length],
      status: statuses[i],
      niche: niches[i % niches.length],
      trigger_source: 'seed',
      steps_total: 12 + Math.floor(Math.random() * 8),
      steps_completed: 0,
      fallback_count: Math.floor(Math.random() * 3),
      error_count: statuses[i] === 'degraded' ? 4 : Math.floor(Math.random() * 2),
      context: { topic: `seed_topic_${i}`, seeded: true },
      started_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      finished_at: new Date(Date.now() - i * 3600000).toISOString(),
      created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    };
    run.steps_completed = run.steps_total - run.error_count;

    if (db.type === 'supabase') {
      const { error } = await db.client.from('pipeline_runs').insert(run);
      if (error) log.warn({ error: error.message }, 'Seed pipeline_runs error');
    } else {
      await db.client.insert('pipeline_runs', run);
    }
  }
  console.log('  ✓  5 pipeline runs seeded');

  // Seed revenue records
  console.log('  Seeding revenue records...');
  const sources = ['product', 'marketplace', 'affiliate', 'subscription'];
  for (let i = 0; i < 4; i++) {
    const rev = {
      id: generateId(),
      source_type: sources[i],
      source_id: `seed_${sources[i]}_${i}`,
      source_name: `Seed ${sources[i]} ${i + 1}`,
      amount_cents: (i + 1) * 997,
      currency: 'USD',
      niche: niches[i % niches.length],
      pipeline_run_id: null,
      metadata: { seeded: true },
      recorded_at: new Date(Date.now() - i * 86400000).toISOString(),
      created_at: now(),
    };

    if (db.type === 'supabase') {
      const { error } = await db.client.from('revenue').insert(rev);
      if (error) log.warn({ error: error.message }, 'Seed revenue error');
    } else {
      await db.client.insert('revenue', rev);
    }
  }
  console.log('  ✓  4 revenue records seeded');

  // Seed assets
  console.log('  Seeding assets...');
  const assetTypes = ['video', 'ebook', 'checklist', 'landing_page', 'email_sequence'];
  for (let i = 0; i < 5; i++) {
    const asset = {
      id: generateId(),
      pipeline_run_id: null,
      asset_type: assetTypes[i],
      title: `Seed ${assetTypes[i]} — ${niches[i % niches.length]}`,
      url: null,
      platform: 'local',
      status: 'created',
      niche: niches[i % niches.length],
      fallback_level: 0,
      metadata: { seeded: true },
      created_at: now(),
    };

    if (db.type === 'supabase') {
      const { error } = await db.client.from('assets').insert(asset);
      if (error) log.warn({ error: error.message }, 'Seed assets error');
    } else {
      await db.client.insert('assets', asset);
    }
  }
  console.log('  ✓  5 assets seeded');

  // Seed usage metrics
  console.log('  Seeding usage metrics...');
  const metrics = [
    { service: 'elevenlabs', metric_type: 'characters_used', value: 0, limit_value: 100000, remaining: 100000 },
    { service: 'railway', metric_type: 'runtime_minutes', value: 0, limit_value: 30000, remaining: 30000 },
  ];
  for (const m of metrics) {
    const metric = {
      id: generateId(),
      ...m,
      pct_used: 0,
      recorded_at: now(),
      created_at: now(),
    };
    if (db.type === 'supabase') {
      const { error } = await db.client.from('usage_metrics').insert(metric);
      if (error) log.warn({ error: error.message }, 'Seed usage_metrics error');
    } else {
      await db.client.insert('usage_metrics', metric);
    }
  }
  console.log('  ✓  2 usage metrics seeded');

  console.log('\n  Seed complete!\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
