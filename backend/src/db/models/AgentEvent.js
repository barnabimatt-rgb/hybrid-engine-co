// backend/src/db/models/AgentEvent.js
import getDB from '../supabase.js';
import { generateId, now } from '../../utils/helpers.js';

const TABLE = 'agent_events';

export const AgentEvent = {
  async log({ pipelineRunId, agentName, stepIndex, status, errorMessage, retryCount, fallbackUsed, durationMs, metadata }) {
    const row = {
      id: generateId(),
      pipeline_run_id: pipelineRunId,
      agent_name: agentName,
      step_index: stepIndex,
      status,
      error_message: errorMessage || null,
      retry_count: retryCount || 0,
      fallback_used: fallbackUsed || null,
      duration_ms: durationMs || null,
      metadata: metadata || {},
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

  async getByPipeline(pipelineRunId) {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client
        .from(TABLE)
        .select('*')
        .eq('pipeline_run_id', pipelineRunId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    }
    const rows = await db.client.select(TABLE, { pipeline_run_id: pipelineRunId });
    return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async getErrorRate(windowMinutes = 60) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const db = getDB();
    if (db.type === 'supabase') {
      const { data: total } = await db.client.from(TABLE).select('id', { count: 'exact' }).gte('created_at', since);
      const { data: errors } = await db.client.from(TABLE).select('id', { count: 'exact' }).gte('created_at', since).eq('status', 'error');
      const t = total?.length || 1;
      const e = errors?.length || 0;
      return Math.round((e / t) * 10000) / 100;
    }
    const rows = await db.client.select(TABLE);
    const recent = rows.filter((r) => r.created_at >= since);
    if (recent.length === 0) return 0;
    const errCount = recent.filter((r) => r.status === 'error').length;
    return Math.round((errCount / recent.length) * 10000) / 100;
  },

  async getRecent(limit = 50) {
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
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },
};

export default AgentEvent;
