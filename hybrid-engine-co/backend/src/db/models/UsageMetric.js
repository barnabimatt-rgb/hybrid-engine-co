// backend/src/db/models/UsageMetric.js
import getDB from '../supabase.js';
import { generateId, now, pct } from '../../utils/helpers.js';

const TABLE = 'usage_metrics';

export const UsageMetric = {
  async record({ service, metricType, value, limitValue, remaining }) {
    const row = {
      id: generateId(),
      service,
      metric_type: metricType,
      value,
      limit_value: limitValue || null,
      remaining: remaining || null,
      pct_used: limitValue ? pct(value, limitValue) : null,
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

  async getLatest(service, metricType) {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .eq('service', service)
        .eq('metric_type', metricType)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    const rows = await db.client.select(TABLE, { service, metric_type: metricType });
    return rows.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0] || null;
  },

  async getAllLatest() {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const seen = new Set();
      return (data || []).filter((r) => {
        const key = `${r.service}:${r.metric_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const rows = await db.client.select(TABLE);
    const sorted = rows.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
    const seen = new Set();
    return sorted.filter((r) => {
      const key = `${r.service}:${r.metric_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};

export default UsageMetric;
