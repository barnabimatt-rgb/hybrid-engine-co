// backend/src/api/middleware/auth.js — API authentication middleware
import { timingSafeEqual } from 'crypto';
import config from '../../config.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('api:auth');

/**
 * API key authentication via Bearer token.
 * If API_SECRET_KEY is not set and NODE_ENV is development, requests pass through with a warning.
 */
export function requireApiKey(req, res, next) {
  const secret = config.auth.apiSecretKey;

  // In dev mode without a key configured, bypass with warning
  if (!secret) {
    if (config.isDev) {
      log.warn({ path: req.path }, 'No API_SECRET_KEY set — auth bypassed in dev mode');
      return next();
    }
    // In production without a key, block everything
    return res.status(500).json({ error: 'Server misconfiguration — API_SECRET_KEY not set' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Use: Bearer <API_SECRET_KEY>' });
  }

  const token = authHeader.slice(7);
  try {
    const tokenBuf = Buffer.from(token);
    const secretBuf = Buffer.from(secret);
    if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

/**
 * Basic auth for dashboard access (optional).
 * If DASHBOARD_USER/DASHBOARD_PASSWORD not set, passes through.
 */
export function requireDashboardAuth(req, res, next) {
  const user = config.auth.dashboardUser;
  const pass = config.auth.dashboardPassword;

  if (!user || !pass) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Hybrid Engine Dashboard"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [u, p] = decoded.split(':');

  if (u !== user || p !== pass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  next();
}
