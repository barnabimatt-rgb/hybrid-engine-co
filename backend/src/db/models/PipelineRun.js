// backend/src/db/models/PipelineRun.js
import getDB from '../supabase.js';
import { now } from '../../utils/helpers.js';

const TABLE = 'pipeline_runs';

export const PipelineRun = {
  async create({ pipelineType, niche, triggerSource = 'cron', context = {} }) {
    const row = {
      // ❗ Removed custom ID — Supabase will generate UUID automatically
      pipeline_type: pipelineType,
      status: 'queued',
      niche,
      trigger_source: triggerSource,
      steps_total: 0,
      steps_completed: 0,
      fallback_count: 0,
      error_count: 0,
      context,
      created_at: now(),
    };

    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return db.client.insert(TABLE, row);
  },

  async updateStatus(id, status, extras = {}) {
    const updates = { status, updated_at: now(), ...extras };
    if (status === 'running') updates.started_at = now();
    if (status === 'completed' || status === 'failed' || status === 'degraded')
      updates.finished_at = now();

    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return db.client.update(TABLE, id, updates);
  },

  async incrementStep(id, field = 'steps_completed') {
    const db = getDB();

    if (db.type === 'supabase') {
      const { data: current } = await db.client
        .from(TABLE)
        .select(field)
        .eq('id', id)
        .single();

      const { data, error } = await db.client
        .from(TABLE)
        .update({
          [field]: (current?.[field] || 0) + 1,
          updated_at: now(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const rows = await db.client.select(TABLE, { id });
    if (rows[0]) {
      rows[0][field] = (rows[0][field] || 0) + 1;
    }
    return rows[0];
  },

  async getRecent(limit = 20) {
    const db = getDB();

    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    const rows = await db.client.select(TABLE);
    return rows
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },

  async getByStatus(status) {
    const db = getDB();

    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .eq('status', status);

      if (error) throw error;
      return data;
    }

    return db.client.select(TABLE, { status });
  },

  async getStuck(timeoutMinutes = 60) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    const db = getDB();

    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .eq('status', 'running')
        .lt('started_at', cutoff);

      if (error) throw error;
      return data;
    }

    const rows = await db.client.select(TABLE, { status: 'running' });
    return rows.filter((r) => r.started_at && r.started_at < cutoff);
  },
};

export default PipelineRun;
