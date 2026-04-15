import 'dotenv/config';

const env = (key, fallback) => process.env[key] ?? fallback;
const int = (key, fallback) => parseInt(env(key, String(fallback)), 10);

const config = Object.freeze({
  port: int('PORT', 3000),
  nodeEnv: env('NODE_ENV', 'development'),
  isDev: env('NODE_ENV', 'development') === 'development',

  supabase: {
    url: env('SUPABASE_URL', ''),
    anonKey: env('SUPABASE_ANON_KEY', ''),
    serviceKey: env('SUPABASE_SERVICE_KEY', ''),
  },

  elevenLabs: {
    apiKey: env('ELEVENLABS_API_KEY', ''),
    monthlyCharLimit: int('ELEVENLABS_MONTHLY_CHAR_LIMIT', 100000),
    voiceId: env('ELEVENLABS_VOICE_ID', ''),
    safetyBuffer: 0.10,
  },

  railway: {
    monthlyHoursLimit: int('RAILWAY_MONTHLY_HOURS_LIMIT', 500),
    dailyHoursLimit: int('RAILWAY_DAILY_HOURS_LIMIT', 20),
    safetyBuffer: 0.10,
  },

  youtube: {
    apiKey: env('YOUTUBE_API_KEY', ''),
    clientId: env('YOUTUBE_CLIENT_ID', ''),
    clientSecret: env('YOUTUBE_CLIENT_SECRET', ''),
    refreshToken: env('YOUTUBE_REFRESH_TOKEN', ''),
  },

  stripe: {
    secretKey: env('STRIPE_SECRET_KEY', ''),
    webhookSecret: env('STRIPE_WEBHOOK_SECRET', ''),
  },

  gumroad: {
    accessToken: env('GUMROAD_ACCESS_TOKEN', ''),
  },

  pexels: {
    apiKey: env('PEXELS_API_KEY', ''),
  },

  openai: {
    apiKey: env('OPENAI_API_KEY', ''),
    model: env('OPENAI_MODEL', 'gpt-4o-mini'),
    monthlyTokenLimit: int('OPENAI_MONTHLY_TOKEN_LIMIT', 500000),
  },

  orchestrator: {
    intervalMinutes: int('ORCHESTRATOR_INTERVAL_MINUTES', 30),
    maxConcurrentPipelines: int('MAX_CONCURRENT_PIPELINES', 2),
    maxRetriesPerAgent: int('MAX_RETRIES_PER_AGENT', 3),
    retryBackoffBaseMs: int('RETRY_BACKOFF_BASE_MS', 1000),
  },

  dashboard: {
    pollIntervalSeconds: int('DASHBOARD_POLL_INTERVAL_SECONDS', 30),
  },

  auth: {
    apiSecretKey: env('API_SECRET_KEY', ''),
    dashboardUser: env('DASHBOARD_USER', ''),
    dashboardPassword: env('DASHBOARD_PASSWORD', ''),
  },

  logLevel: env('LOG_LEVEL', 'info'),
});

export default config;
