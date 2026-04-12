// backend/src/orchestrator/Orchestrator.js — Main cron loop
import cron from 'node-cron';
import config from '../config.js';
import pipelineRegistry from './PipelineRegistry.js';
import pipelineRunner from './PipelineRunner.js';
import pipelineRecovery from '../selfheal/PipelineRecovery.js';
import limitManager from '../limits/LimitManager.js';
import { createLogger } from '../utils/logger.js';
import { pickRandom } from '../utils/helpers.js';
import { ALL_NICHES } from '../niche/NicheConfig.js';

const log = createLogger('orchestrator');

class Orchestrator {
  constructor() {
    this.running = false;
    this.cronJob = null;
    this.activePipelines = 0;
    this.totalRuns = 0;
  }

  start() {
    const intervalMinutes = config.orchestrator.intervalMinutes;
    log.info({ intervalMinutes }, 'Orchestrator starting');

    // Run immediately on boot
    this._tick();

    // Then run on interval
    this.cronJob = cron.schedule(`*/${intervalMinutes} * * * *`, () => {
      this._tick();
    });

    this.running = true;
    log.info('Orchestrator running');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.running = false;
    log.info('Orchestrator stopped');
  }

  async _tick() {
    if (this.activePipelines >= config.orchestrator.maxConcurrentPipelines) {
      log.info({ active: this.activePipelines }, 'Max concurrent pipelines reached — skipping tick');
      return;
    }

    try {
      // 1. Recover stuck pipelines
      const recovered = await pipelineRecovery.detectAndRecover();
      if (recovered.length > 0) {
        log.info({ recovered: recovered.length }, 'Recovered stuck pipelines');
      }

      // 2. Check if we have headroom to run
      if (!limitManager.canRunHeavyTask()) {
        log.info('Limits too tight — running lightweight pipeline only');
        await this._runPipeline('self_optimization');
        return;
      }

      // 3. Select and run a pipeline
      const pipelineName = this._selectPipeline();
      await this._runPipeline(pipelineName);

    } catch (err) {
      log.error({ error: err.message }, 'Orchestrator tick failed');
    }
  }

  _selectPipeline() {
    // Weighted selection: content and product are higher priority
    const headroom = limitManager.getHeadroomScore();
    const weighted = [];

    if (headroom > 0.5) {
      // Plenty of headroom — run revenue-generating pipelines
      weighted.push('content', 'content', 'product', 'product', 'funnel', 'marketplace', 'affiliate');
    } else if (headroom > 0.2) {
      // Moderate headroom — lighter pipelines
      weighted.push('content', 'product', 'funnel', 'self_optimization');
    } else {
      // Low headroom — optimization only
      weighted.push('self_optimization', 'self_optimization', 'affiliate');
    }

    return pickRandom(weighted);
  }

  async _runPipeline(name) {
    let pipelineDef;
    try {
      pipelineDef = pipelineRegistry.get(name);
    } catch (err) {
      log.error({ name, error: err.message }, 'Pipeline not found');
      return;
    }

    this.activePipelines++;
    this.totalRuns++;

    const targetNiche = pickRandom(ALL_NICHES);
    log.info({ pipeline: name, niche: targetNiche, run: this.totalRuns }, 'Starting pipeline run');

    try {
      const result = await pipelineRunner.run(pipelineDef, {
        targetNiche,
        triggerSource: 'cron',
      });

      log.info({ pipeline: name, status: result.status, fallbacks: result.fallbackCount, errors: result.errorCount }, 'Pipeline run complete');
    } catch (err) {
      log.error({ pipeline: name, error: err.message }, 'Pipeline run failed');
    } finally {
      this.activePipelines--;
    }
  }

  getStatus() {
    return {
      running: this.running,
      activePipelines: this.activePipelines,
      totalRuns: this.totalRuns,
      intervalMinutes: config.orchestrator.intervalMinutes,
      maxConcurrent: config.orchestrator.maxConcurrentPipelines,
    };
  }
}

const orchestrator = new Orchestrator();
export default orchestrator;
