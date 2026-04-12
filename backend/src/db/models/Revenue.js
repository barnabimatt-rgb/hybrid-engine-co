// backend/src/db/models/Revenue.js
import getDB from '../supabase.js';
import { generateId, now } from '../../utils/helpers.js';

const TABLE = 'revenue';

export const Revenue = {
  async record({ sourceType, sourceId, sourceName, amountCents, niche, pipelineRunId, metadata }) {
    const row = {
      id: generateId(),
      source_type: sourceType,
      source_id: sourceId || null,
      source_name: sourceName || null,
      amount_cents: amountCents,
      currency: 'USD',
      niche: niche || null,
      pipeline_run_id: pipelineRunId || null,
      metadata: metadata || {},
      recorded_at: now(),
      created_at: now(),
    };
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).insert(row).select().single();
      if (error) throw error;
      return data;
    }
    return db.client.insert(TABLE, row);
  },

  async getTotalRevenue() {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).select('amount_cents');
      if (error) throw error;
      return (data || []).reduce((sum, r) => sum + r.amount_cents, 0);
    }
    const rows = await db.client.select(TABLE);
    return rows.reduce((sum, r) => sum + r.amount_cents, 0);
  },

  async getRevenueBySource() {
    const db = getDB();
    const rows = db.type === 'supabase'
      ? (await db.client.from(TABLE).select('source_type, amount_cents')).data || []
      : await db.client.select(TABLE);
    const grouped = {};
    for (const r of rows) {
      grouped[r.source_type] = (grouped[r.source_type] || 0) + r.amount_cents;
    }
    return grouped;
  },

  async getRevenueByNiche() {
    const db = getDB();
    const rows = db.type === 'supabase'
      ? (await db.client.from(TABLE).select('niche, amount_cents')).data || []
      : await db.client.select(TABLE);
    const grouped = {};
    for (const r of rows) {
      const n = r.niche || 'unknown';
      grouped[n] = (grouped[n] || 0) + r.amount_cents;
    }
    return grouped;
  },

  async getRevenueByPeriod(periodDays = 30) {
    const since = new Date(Date.now() - periodDays * 86400000).toISOString();
    const db = getDB();
    if (db.type === 'supabase') {
      const { data } = await db.client.from(TABLE).select('*').gte('recorded_at', since).order('recorded_at', { ascending: true });
      return data || [];
    }
    const rows = await db.client.select(TABLE);
    return rows.filter((r) => r.recorded_at >= since);
  },

  async getRecent(limit = 20) {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).select('*').order('recorded_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    }
    const rows = await db.client.select(TABLE);
    return rows.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).slice(0, limit);
  },
};

export default Revenue;
