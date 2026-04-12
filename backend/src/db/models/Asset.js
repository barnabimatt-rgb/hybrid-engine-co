// backend/src/db/models/Asset.js
import getDB from '../supabase.js';
import { generateId, now } from '../../utils/helpers.js';

const TABLE = 'assets';

export const Asset = {
  async create({ pipelineRunId, assetType, title, url, platform, niche, fallbackLevel = 0, metadata }) {
    const row = {
      id: generateId(),
      pipeline_run_id: pipelineRunId || null,
      asset_type: assetType,
      title: title || null,
      url: url || null,
      platform: platform || 'local',
      status: 'created',
      niche: niche || null,
      fallback_level: fallbackLevel,
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

  async markPublished(id, url) {
    const updates = { status: 'published', url, published_at: now() };
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return db.client.update(TABLE, id, updates);
  },

  async markFailed(id, errorMsg) {
    const updates = { status: 'failed', metadata: { error: errorMsg } };
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    return db.client.update(TABLE, id, updates);
  },

  async getByPipeline(pipelineRunId) {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).select('*').eq('pipeline_run_id', pipelineRunId);
      if (error) throw error;
      return data;
    }
    return db.client.select(TABLE, { pipeline_run_id: pipelineRunId });
  },

  async countByType() {
    const db = getDB();
    const rows = db.type === 'supabase'
      ? (await db.client.from(TABLE).select('asset_type')).data || []
      : await db.client.select(TABLE);
    const grouped = {};
    for (const r of rows) {
      grouped[r.asset_type] = (grouped[r.asset_type] || 0) + 1;
    }
    return grouped;
  },

  async getRecent(limit = 20) {
    const db = getDB();
    if (db.type === 'supabase') {
      const { data, error } = await db.client.from(TABLE).select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    }
    const rows = await db.client.select(TABLE);
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  },
};

export default Asset;
