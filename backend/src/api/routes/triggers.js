// backend/src/api/routes/triggers.js — Manual pipeline triggers
import { Router } from 'express';
import pipelineRunner from '../../orchestrator/PipelineRunner.js';
import pipelineRegistry from '../../orchestrator/PipelineRegistry.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('api:triggers');
const router = Router();

router.post('/run/:pipeline', async (req, res) => {
  const pipelineName = req.params.pipeline;
  const context = req.body || {};

  try {
    const pipelineDef = pipelineRegistry.get(pipelineName);
    log.info({ pipeline: pipelineName }, 'Manual pipeline trigger');

    // Run async — don't block the response
    const runPromise = pipelineRunner.run(pipelineDef, {
      ...context,
      triggerSource: 'manual',
    });

    // Return immediately with run info
    res.json({
      triggered: true,
      pipeline: pipelineName,
      steps: pipelineDef.steps.length,
      message: `Pipeline "${pipelineName}" triggered. Check /api/pipelines for status.`,
    });

    // Let it run in background
    runPromise.catch((err) => {
      log.error({ pipeline: pipelineName, error: err.message }, 'Manual pipeline run failed');
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/available', (req, res) => {
  res.json({ pipelines: pipelineRegistry.describe() });
});

export default router;
