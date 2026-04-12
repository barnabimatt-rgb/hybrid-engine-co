// backend/src/api/routes/pipelines.js
import { Router } from 'express';
import PipelineRun from '../../db/models/PipelineRun.js';
import AgentEvent from '../../db/models/AgentEvent.js';
import pipelineRegistry from '../../orchestrator/PipelineRegistry.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20');
    const runs = await PipelineRun.getRecent(limit);
    res.json({ runs, registered: pipelineRegistry.describe() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const events = await AgentEvent.getByPipeline(req.params.id);
    res.json({ pipelineRunId: req.params.id, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/active', async (req, res) => {
  try {
    const running = await PipelineRun.getByStatus('running');
    const queued = await PipelineRun.getByStatus('queued');
    res.json({ running, queued });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
