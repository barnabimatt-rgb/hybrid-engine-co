import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('db:supabase');

let client = null;
let supabaseHealthy = null; // null = untested, true/false after probe
let noCredsWarned = false;

export function getSupabase() {
  if (!client) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      if (!noCredsWarned) {
        log.warn('Supabase credentials not configured — using in-memory fallback');
        noCredsWarned = true;
      }
      return null;
    }
    client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false },
    });
    log.info('Supabase client initialized');
  }
  return client;
}

/**
 * Probe Supabase once on first use — if the URL is wrong or tables don't exist,
 * permanently fall back to memDB instead of crashing every pipeline run.
 */
async function probeSupabase(sb) {
  if (supabaseHealthy !== null) return supabaseHealthy;
  try {
    const { error } = await sb.from('pipeline_runs').select('id').limit(1);
    if (error) {
      // Table might not exist or URL might be wrong
      const msg = typeof error === 'string' ? error : (error.message || JSON.stringify(error)).slice(0, 200);
      log.warn({ error: msg }, 'Supabase probe failed — falling back to in-memory DB');
      supabaseHealthy = false;
    } else {
      log.info('Supabase probe succeeded — using Supabase');
      supabaseHealthy = true;
    }
  } catch (err) {
    log.warn({ error: err.message }, 'Supabase probe threw — falling back to in-memory DB');
    supabaseHealthy = false;
  }
  return supabaseHealthy;
}

const memoryStore = new Map();

const MAX_ROWS_PER_TABLE = 1000;
const EVICTION_TRIGGER = 1200; // Start evicting when table exceeds this

export const memDB = {
  async insert(table, row) {
    if (!memoryStore.has(table)) memoryStore.set(table, []);
    const rows = memoryStore.get(table);
    rows.push({ ...row, created_at: new Date().toISOString() });
    // Evict oldest rows if table exceeds threshold
    if (rows.length > EVICTION_TRIGGER) {
      const evicted = rows.length - MAX_ROWS_PER_TABLE;
      rows.splice(0, evicted);
      log.info({ table, evicted, remaining: rows.length }, 'memDB eviction — pruned oldest rows');
    }
    return row;
  },
  async select(table, filters = {}) {
    const rows = memoryStore.get(table) || [];
    return rows.filter((row) => Object.entries(filters).every(([k, v]) => row[k] === v));
  },
  async update(table, id, updates) {
    const rows = memoryStore.get(table) || [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...updates, updated_at: new Date().toISOString() };
      return rows[idx];
    }
    return null;
  },
  async upsert(table, row, key = 'id') {
    const rows = memoryStore.get(table) || [];
    const idx = rows.findIndex((r) => r[key] === row[key]);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...row, updated_at: new Date().toISOString() };
      return rows[idx];
    }
    return this.insert(table, row);
  },
  async count(table) {
    return (memoryStore.get(table) || []).length;
  },
  getStats() {
    const stats = {};
    let totalRows = 0;
    for (const [table, rows] of memoryStore) {
      stats[table] = rows.length;
      totalRows += rows.length;
    }
    return { tables: stats, totalRows, tableCount: memoryStore.size };
  },
  dump() {
    const out = {};
    for (const [k, v] of memoryStore) out[k] = v;
    return out;
  },
  clear() {
    memoryStore.clear();
  },
};

/**
 * Returns the active database handle.
 * On first call with Supabase configured, probes the connection.
 * If the probe fails (wrong URL, missing tables, network), permanently uses memDB.
 */
export async function getDBAsync() {
  const sb = getSupabase();
  if (sb) {
    const healthy = await probeSupabase(sb);
    if (healthy) return { type: 'supabase', client: sb };
  }
  return { type: 'memory', client: memDB };
}

/**
 * Synchronous version — returns Supabase only if probe already passed.
 * Safe to call in hot paths; uses memDB if probe hasn't run or failed.
 */
export function getDB() {
  if (supabaseHealthy === true) {
    const sb = getSupabase();
    if (sb) return { type: 'supabase', client: sb };
  }
  if (supabaseHealthy === false) {
    return { type: 'memory', client: memDB };
  }
  // Probe hasn't run yet — trigger it in the background, use memDB for now
  const sb = getSupabase();
  if (sb) {
    probeSupabase(sb).catch(() => {});
    // Use memDB until probe completes; next call will have the result
    return { type: 'memory', client: memDB };
  }
  return { type: 'memory', client: memDB };
}

export default getDB;
