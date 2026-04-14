// backend/src/selfheal/PipelineRecovery.js
import PipelineRun from '../db/models/PipelineRun.js';
import { createLogger } from '../utils/logger.js';
import eventBus, { Events } from '../utils/eventBus.js';

const log = createLogger('selfheal:recovery');
const STUCK_TIMEOUT_MINUTES = 60;
const MAX_PIPELINE_RETRIES = 3;

export class PipelineRecovery {
  async detectAndRecover() {
    const recovered = [];
    try {
      const stuck = await PipelineRun.getStuck(STUCK_TIMEOUT_MINUTES);
      if (stuck.length === 0) return recovered;

      log.warn({ count: stuck.length }, 'Stuck pipelines detected');

      for (const run of stuck) {
        try {
          await PipelineRun.updateStatus(run.id, 'failed', {
            error_count: (run.error_count || 0) + 1,
            context: { ...run.context, failReason: 'stuck_timeout', recoveredAt: new Date().toISOString() },
          });

          if ((run.context?.retryCount || 0) < MAX_PIPELINE_RETRIES) {
            const retryRun = await PipelineRun.create({
              pipelineType: run.pipeline_type,
              niche: run.niche,
              triggerSource: 'retry',
              context: { ...run.context, retryOf: run.id, retryCount: (run.context?.retryCount || 0) + 1 },
            });
            recovered.push(retryRun.id);
            eventBus.emit(Events.HEAL_RECOVERY, { originalRunId: run.id, newRunId: retryRun.id, pipelineType: run.pipeline_type });
            log.info({ originalId: run.id, newId: retryRun.id }, 'Pipeline recovered');
          } else {
            log.warn({ runId: run.id }, 'Pipeline abandoned — max retries exceeded');
          }
        } catch (err) {
          log.error({ runId: run.id, error: err.message }, 'Recovery failed');
        }
      }
    } catch (err) {
      log.error({ error: (err.message || String(err)).slice(0, 300) }, 'Recovery scan failed');
    }
    return recovered;
  }
}

export default new PipelineRecovery();
