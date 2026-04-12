import EventEmitter from 'eventemitter3';

const eventBus = new EventEmitter();

export const Events = Object.freeze({
  PIPELINE_START: 'pipeline:start',
  PIPELINE_STEP_COMPLETE: 'pipeline:step:complete',
  PIPELINE_STEP_FAILED: 'pipeline:step:failed',
  PIPELINE_COMPLETE: 'pipeline:complete',
  PIPELINE_FAILED: 'pipeline:failed',
  AGENT_START: 'agent:start',
  AGENT_SUCCESS: 'agent:success',
  AGENT_ERROR: 'agent:error',
  AGENT_RETRY: 'agent:retry',
  AGENT_FALLBACK: 'agent:fallback',
  AGENT_SKIP: 'agent:skip',
  HEAL_RETRY: 'heal:retry',
  HEAL_FALLBACK: 'heal:fallback',
  HEAL_RECOVERY: 'heal:recovery',
  HEAL_STUCK_DETECTED: 'heal:stuck',
  LIMIT_WARNING: 'limit:warning',
  LIMIT_THROTTLE: 'limit:throttle',
  LIMIT_BLOCKED: 'limit:blocked',
  REVENUE_RECORDED: 'revenue:recorded',
  ASSET_CREATED: 'asset:created',
  ASSET_PUBLISHED: 'asset:published',
  ASSET_FAILED: 'asset:failed',
});

export default eventBus;
