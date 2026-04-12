// backend/src/orchestrator/PipelineRunner.js — Walks pipeline steps with self-healing
import selfHealingWrapper from '../selfheal/SelfHealingWrapper.js';
import agentRegistry from '../agents/AgentRegistry.js';
import PipelineRun from '../db/models/PipelineRun.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';

const log = createLogger('orchestrator:runner');

export class PipelineRunner {
  /**
   * Execute a full pipeline definition
   * @param {object} pipelineDef - { name, steps: [{ agentName, fallbackChain? }] }
   * @param {object} initialContext - Starting context for the pipeline
   * @returns {object} Final context after all steps
   */
  async run(pipelineDef, initialContext = {}) {
    const run = await PipelineRun.create({
      pipelineType: pipelineDef.name,
      niche: initialContext.targetNiche || initialContext.niche || null,
      triggerSource: initialContext.triggerSource || 'cron',
      context: initialContext,
    });

    const runId = run.id;
    let context = { ...initialContext, pipelineRunId: runId };
    const steps = pipelineDef.steps;

    await PipelineRun.updateStatus(runId, 'running', { steps_total: steps.length });
    eventBus.emit(Events.PIPELINE_START, { runId, pipeline: pipelineDef.name, steps: steps.length });

    log.info({ runId, pipeline: pipelineDef.name, steps: steps.length }, 'Pipeline started');

    let fallbackCount = 0;
    let errorCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const stepDef = steps[i];
      const agentName = stepDef.agentName;

      let agent;
      try {
        agent = agentRegistry.get(agentName);
      } catch (err) {
        log.error({ agentName, error: err.message }, 'Agent not found — skipping step');
        errorCount++;
        continue;
      }

      log.info({ runId, step: i, agent: agentName }, 'Executing step');

      const { result, status, fallbackLevel } = await selfHealingWrapper.execute(
        agent,
        context,
        {
          pipelineRunId: runId,
          stepIndex: i,
          fallbackChain: stepDef.fallbackChain || null,
        }
      );

      // Merge result into context
      if (result && typeof result === 'object' && result.type !== 'degraded') {
        context = { ...context, ...result };
      }

      if (status === 'fallback') fallbackCount++;
      if (status === 'degraded') errorCount++;

      await PipelineRun.incrementStep(runId, 'steps_completed');

      eventBus.emit(Events.PIPELINE_STEP_COMPLETE, {
        runId, step: i, agent: agentName, status, fallbackLevel,
      });
    }

    // Determine final status
    const finalStatus = errorCount > steps.length / 2 ? 'degraded' : 'completed';

    await PipelineRun.updateStatus(runId, finalStatus, {
      fallback_count: fallbackCount,
      error_count: errorCount,
      context,
    });

    eventBus.emit(Events.PIPELINE_COMPLETE, { runId, pipeline: pipelineDef.name, status: finalStatus, fallbackCount, errorCount });
    log.info({ runId, pipeline: pipelineDef.name, finalStatus, fallbackCount, errorCount }, 'Pipeline finished');

    return { runId, status: finalStatus, context, fallbackCount, errorCount };
  }
}

const pipelineRunner = new PipelineRunner();
export default pipelineRunner;
