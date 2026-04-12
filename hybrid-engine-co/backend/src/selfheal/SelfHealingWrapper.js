// backend/src/selfheal/SelfHealingWrapper.js
import { RetryStrategy } from './RetryStrategy.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';
import AgentEvent from '../db/models/AgentEvent.js';

const log = createLogger('selfheal:wrapper');

export class SelfHealingWrapper {
  constructor(options = {}) {
    this.retryStrategy = new RetryStrategy(options.retry || {});
  }

  async execute(agent, context, options = {}) {
    const agentName = agent.constructor?.name || agent.name || 'UnknownAgent';
    const startTime = Date.now();
    const meta = { agentName, pipelineRunId: options.pipelineRunId, stepIndex: options.stepIndex };

    eventBus.emit(Events.AGENT_START, meta);

    // Attempt 1: Retry the agent
    try {
      const { result, attempts } = await this.retryStrategy.execute(
        (attempt) => agent.execute(context, { attempt }),
        meta
      );
      const durationMs = Date.now() - startTime;
      eventBus.emit(Events.AGENT_SUCCESS, { ...meta, attempts, durationMs });
      await AgentEvent.log({ pipelineRunId: options.pipelineRunId, agentName, stepIndex: options.stepIndex, status: 'success', retryCount: attempts - 1, durationMs });
      return { result, status: 'success', fallbackLevel: 0, attempts };
    } catch (retryError) {
      log.warn({ ...meta, error: retryError.message }, 'All retries exhausted');
      eventBus.emit(Events.AGENT_ERROR, { ...meta, error: retryError.message });
      await AgentEvent.log({ pipelineRunId: options.pipelineRunId, agentName, stepIndex: options.stepIndex, status: 'error', errorMessage: retryError.message, retryCount: this.retryStrategy.maxRetries, durationMs: Date.now() - startTime });

      // Attempt 2: Fallback chain
      if (options.fallbackChain) {
        try {
          log.info(meta, 'Entering fallback chain');
          const fbResult = await options.fallbackChain.execute(context);
          eventBus.emit(Events.HEAL_FALLBACK, { ...meta, strategy: fbResult.strategyUsed, level: fbResult.fallbackLevel });
          await AgentEvent.log({ pipelineRunId: options.pipelineRunId, agentName, stepIndex: options.stepIndex, status: 'fallback', fallbackUsed: fbResult.strategyUsed, durationMs: Date.now() - startTime });
          return { result: fbResult.result, status: 'fallback', fallbackLevel: fbResult.fallbackLevel, attempts: this.retryStrategy.maxRetries + 1 };
        } catch (fbError) {
          log.error({ ...meta, error: fbError.message }, 'Fallback chain failed');
        }
      }

      // Attempt 3: Degraded — NEVER block pipeline
      log.error(meta, 'All recovery failed — degraded output');
      eventBus.emit(Events.AGENT_SKIP, { ...meta, reason: 'all_recovery_failed' });
      await AgentEvent.log({ pipelineRunId: options.pipelineRunId, agentName, stepIndex: options.stepIndex, status: 'skipped', errorMessage: 'All recovery exhausted', durationMs: Date.now() - startTime });
      return {
        result: { type: 'degraded', agent: agentName, message: `${agentName} skipped`, originalError: retryError.message },
        status: 'degraded',
        fallbackLevel: 999,
        attempts: this.retryStrategy.maxRetries + 1,
      };
    }
  }
}

const selfHealingWrapper = new SelfHealingWrapper();
export default selfHealingWrapper;
