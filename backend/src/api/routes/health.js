// backend/src/api/routes/health.js
import { Router } from 'express';
import limitManager from '../../limits/LimitManager.js';
import orchestrator from '../../orchestrator/Orchestrator.js';
import agentRegistry from '../../agents/AgentRegistry.js';

const router = Router();

router.get('/', (req, res) => {
  const limits = limitManager.getSnapshot();
  const sys = limits.railway.system;

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    orchestrator: orchestrator.getStatus(),
    agents: agentRegistry.count,
    system: {
      memoryUsedMB: sys.memoryUsedMB,
      memoryPct: sys.memoryPct,
      uptimeMinutes: sys.uptimeMinutes,
    },
    limits: {
      elevenlabs: { pctUsed: limits.elevenlabs.pctUsed, remaining: limits.elevenlabs.remaining },
      railway: { dailyPctUsed: limits.railway.daily.pctUsed, monthlyPctUsed: limits.railway.monthly.pctUsed },
    },
    headroom: limits.headroom,
  });
});

router.get('/detailed', (req, res) => {
  res.json({
    status: 'ok',
    orchestrator: orchestrator.getStatus(),
    agents: agentRegistry.describe(),
    limits: limitManager.getSnapshot(),
    process: {
      pid: process.pid,
      version: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

export default router;
