CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  niche TEXT,
  trigger_source TEXT DEFAULT 'cron',
  steps_total INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  fallback_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_type ON pipeline_runs(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID REFERENCES pipeline_runs(id),
  agent_name TEXT NOT NULL,
  step_index INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  fallback_used TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_events_pipeline ON agent_events(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_status ON agent_events(status);

CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  niche TEXT,
  pipeline_run_id UUID REFERENCES pipeline_runs(id),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue(source_type);
CREATE INDEX IF NOT EXISTS idx_revenue_niche ON revenue(niche);
CREATE INDEX IF NOT EXISTS idx_revenue_recorded ON revenue(recorded_at DESC);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  limit_value NUMERIC,
  remaining NUMERIC,
  pct_used NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_service ON usage_metrics(service);
CREATE INDEX IF NOT EXISTS idx_usage_recorded ON usage_metrics(recorded_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID REFERENCES pipeline_runs(id),
  asset_type TEXT NOT NULL,
  title TEXT,
  url TEXT,
  platform TEXT,
  status TEXT DEFAULT 'created',
  niche TEXT,
  fallback_level INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_pipeline ON assets(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_pct NUMERIC,
  memory_pct NUMERIC,
  queue_depth INTEGER DEFAULT 0,
  active_pipelines INTEGER DEFAULT 0,
  error_rate NUMERIC DEFAULT 0,
  retry_rate NUMERIC DEFAULT 0,
  fallback_rate NUMERIC DEFAULT 0,
  uptime_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_recorded ON system_health(recorded_at DESC);

CREATE TABLE IF NOT EXISTS niche_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  period TEXT NOT NULL,
  period_start DATE NOT NULL,
  revenue_cents INTEGER DEFAULT 0,
  output_count INTEGER DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  top_product TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(niche, period, period_start)
);
CREATE INDEX IF NOT EXISTS idx_niche_perf_niche ON niche_performance(niche);
CREATE INDEX IF NOT EXISTS idx_niche_perf_period ON niche_performance(period_start DESC);

CREATE TABLE IF NOT EXISTS pipeline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  picked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_queue_status ON pipeline_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON pipeline_queue(priority ASC, scheduled_for ASC);
