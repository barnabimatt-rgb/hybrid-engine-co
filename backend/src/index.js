// backend/src/index.js — Entry point: Express server + Orchestrator
import config from './config.js';
import { createApp } from './api/server.js';
import orchestrator from './orchestrator/Orchestrator.js';
import agentRegistry from './agents/AgentRegistry.js';
import freeApiRegistry from './agents/free-api/FreeApiRegistry.js';
import pipelineRegistry from './orchestrator/PipelineRegistry.js';
import { getDBAsync } from './db/supabase.js';
import { createLogger } from './utils/logger.js';

const log = createLogger('main');

async function main() {
  log.info('═══════════════════════════════════════════');
  log.info('  HYBRID ENGINE CO. — Starting up...');
  log.info('═══════════════════════════════════════════');

  // 1. Log agent and pipeline counts
  log.info({ agents: agentRegistry.count }, 'Agents loaded');
  log.info({ freeApiAgents: freeApiRegistry.count }, 'Free API agents loaded');
  log.info({ pipelines: pipelineRegistry.getAllNames() }, 'Pipelines registered');

  // 1.5 Probe database before anything touches it
  const db = await getDBAsync();
  log.info({ dbType: db.type }, 'Database ready');

  // 1.6 Log external API service availability
  const services = {
    openai: !!config.openai.apiKey,
    elevenLabs: !!config.elevenLabs.apiKey,
    youtube: !!(config.youtube.clientId && config.youtube.clientSecret && config.youtube.refreshToken),
    stripe: !!config.stripe.secretKey,
    gumroad: !!config.gumroad.accessToken,
    supabase: db.type === 'supabase',
  };
  const configured = Object.entries(services).filter(([, v]) => v).map(([k]) => k);
  const missing = Object.entries(services).filter(([, v]) => !v).map(([k]) => k);
  log.info({ configured, missing }, 'External API services');
  if (!services.youtube) log.warn('YouTube credentials NOT configured — content will be saved locally only, no YouTube uploads');
  if (!services.elevenLabs) log.warn('ElevenLabs NOT configured — voiceover will use silent fallback audio');

  // 2. Start Express server
  const app = createApp();
  const server = app.listen(config.port, () => {
    log.info({ port: config.port, env: config.nodeEnv }, 'Express server running');
  });

  // 3. Start orchestrator (cron-driven pipeline executor)
  orchestrator.start();

  // 4. Graceful shutdown
  const shutdown = (signal) => {
    log.info({ signal }, 'Shutdown signal received');
    orchestrator.stop();
    server.close(() => {
      log.info('Server closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    log.error({ error: reason?.message || String(reason) }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    log.error({ error: err.message }, 'Uncaught exception');
    // Don't exit — self-healing system should continue
  });

  log.info('═══════════════════════════════════════════');
  log.info('  HYBRID ENGINE CO. — ONLINE');
  log.info('═══════════════════════════════════════════');
}

main().catch((err) => {
  log.error({ error: err.message }, 'Fatal startup error');
  process.exit(1);
});
