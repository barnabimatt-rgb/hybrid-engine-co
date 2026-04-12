// backend/src/api/routes/dashboard.js — Dashboard data endpoints
import { Router } from 'express';
import Revenue from '../../db/models/Revenue.js';
import Asset from '../../db/models/Asset.js';
import AgentEvent from '../../db/models/AgentEvent.js';
import PipelineRun from '../../db/models/PipelineRun.js';
import UsageMetric from '../../db/models/UsageMetric.js';
import limitManager from '../../limits/LimitManager.js';
import orchestrator from '../../orchestrator/Orchestrator.js';
import pipelineRegistry from '../../orchestrator/PipelineRegistry.js';

const router = Router();

// Full dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const [totalRevenue, revenueBySource, revenueByNiche, assetCounts, recentRuns, errorRate, recentEvents] = await Promise.all([
      Revenue.getTotalRevenue(),
      Revenue.getRevenueBySource(),
      Revenue.getRevenueByNiche(),
      Asset.countByType(),
      PipelineRun.getRecent(10),
      AgentEvent.getErrorRate(60),
      AgentEvent.getRecent(20),
    ]);

    const limits = limitManager.getSnapshot();
    const orch = orchestrator.getStatus();

    res.json({
      revenue: { totalCents: totalRevenue, totalFormatted: `$${(totalRevenue / 100).toFixed(2)}`, bySource: revenueBySource, byNiche: revenueByNiche },
      output: assetCounts,
      pipelines: { recent: recentRuns, orchestrator: orch, registered: pipelineRegistry.getAllNames() },
      health: { errorRate, limits, system: limits.railway.system },
      events: recentEvents,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue detail
router.get('/revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30');
    const [total, bySource, byNiche, history, recent] = await Promise.all([
      Revenue.getTotalRevenue(),
      Revenue.getRevenueBySource(),
      Revenue.getRevenueByNiche(),
      Revenue.getRevenueByPeriod(days),
      Revenue.getRecent(50),
    ]);
    res.json({ totalCents: total, bySource, byNiche, history, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Output / Assets
router.get('/output', async (req, res) => {
  try {
    const [counts, recent] = await Promise.all([
      Asset.countByType(),
      Asset.getRecent(50),
    ]);
    res.json({ counts, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Limits / Usage
router.get('/limits', async (req, res) => {
  try {
    const snapshot = limitManager.getSnapshot();
    const usageHistory = await UsageMetric.getAllLatest();
    res.json({ current: snapshot, history: usageHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System health
router.get('/health', async (req, res) => {
  try {
    const errorRate = await AgentEvent.getErrorRate(60);
    const limits = limitManager.getSnapshot();
    const orch = orchestrator.getStatus();
    res.json({
      errorRate,
      limits,
      orchestrator: orch,
      system: limits.railway.system,
      process: { pid: process.pid, uptime: process.uptime(), memory: process.memoryUsage() },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pipeline runs
router.get('/pipelines', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20');
    const recent = await PipelineRun.getRecent(limit);
    const registered = pipelineRegistry.describe();
    res.json({ recent, registered, orchestrator: orchestrator.getStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent events / logs
router.get('/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const events = await AgentEvent.getRecent(limit);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
