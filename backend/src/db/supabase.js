import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('db:supabase');

let client = null;

export function getSupabase() {
  if (!client) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      log.warn('Supabase credentials not configured — using in-memory fallback');
      return null;
    }
    client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false },
    });
    log.info('Supabase client initialized');
  }
  return client;
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

export function getDB() {
  const sb = getSupabase();
  if (sb) return { type: 'supabase', client: sb };
  return { type: 'memory', client: memDB };
}

export default getDB;
