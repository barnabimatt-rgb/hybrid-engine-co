// backend/src/api/server.js — Express app factory
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import healthRoutes from './routes/health.js';
import dashboardRoutes from './routes/dashboard.js';
import pipelinesRoutes from './routes/pipelines.js';
import webhooksRoutes from './routes/webhooks.js';
import triggersRoutes from './routes/triggers.js';
import freeApisRoutes from './routes/freeApis.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('api:server');
const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/pipelines', pipelinesRoutes);
  app.use('/api/webhooks', webhooksRoutes);
  app.use('/api/triggers', triggersRoutes);
  app.use('/api/free-apis', freeApisRoutes);

  // Serve frontend static files
  const frontendBuild = join(__dirname, '..', '..', '..', 'frontend', 'public');
  if (existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(join(frontendBuild, 'index.html'));
    });
    log.info({ path: frontendBuild }, 'Serving frontend');
  }

  // Global error handler
  app.use((err, req, res, next) => {
    log.error({ error: err.message, path: req.path }, 'Unhandled API error');
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return app;
}

export default createApp;
