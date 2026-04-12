// backend/src/api/routes/freeApis.js — Dashboard endpoints for free API agents
import { Router } from 'express';
import freeApiRegistry from '../../agents/free-api/FreeApiRegistry.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('api:free-apis');
const router = Router();

// List all free API agents with their status
router.get('/', (req, res) => {
  res.json({
    agents: freeApiRegistry.getApiSummary(),
    count: freeApiRegistry.count,
    timestamp: new Date().toISOString(),
  });
});

// Health check all agents
router.get('/health', async (req, res) => {
  try {
    const results = await freeApiRegistry.healthCheckAll();
    const healthy = Object.values(results).filter((r) => r.status === 'healthy').length;
    res.json({
      overall: healthy === freeApiRegistry.count ? 'healthy' : healthy > 0 ? 'degraded' : 'unhealthy',
      healthy,
      total: freeApiRegistry.count,
      agents: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute a specific agent
router.post('/execute/:agentName', async (req, res) => {
  try {
    const agent = freeApiRegistry.get(req.params.agentName);
    const context = req.body || {};
    log.info({ agent: req.params.agentName }, 'Manual free API agent execution');
    const result = await agent.execute(context);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get detailed info for a specific agent
router.get('/agent/:agentName', (req, res) => {
  try {
    const agent = freeApiRegistry.get(req.params.agentName);
    res.json(agent.describe());
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Batch execute — run multiple agents at once
router.post('/batch', async (req, res) => {
  const { agents: agentNames, context } = req.body || {};
  const names = agentNames || freeApiRegistry.getAll().map((a) => a.name);
  const results = {};

  for (const name of names) {
    try {
      const agent = freeApiRegistry.get(name);
      results[name] = await agent.execute(context || {});
    } catch (err) {
      results[name] = { error: err.message, fallback: true };
    }
  }

  res.json({ results, executedAt: new Date().toISOString() });
});

export default router;
