# Hybrid Engine Co.

Fully autonomous, passive-income AI engine specializing in **Hybrid Fitness**, **Data Science**, and **Data-Driven Performance**.

## Architecture

- **Backend**: Node.js + Express — orchestrator, 55 agents, 6 pipelines, self-healing, limit-aware logic
- **Frontend**: React SPA dashboard — revenue, costs, output, system health, niche performance
- **Database**: Supabase (Postgres) with in-memory fallback
- **Deployment**: Railway Hobby (Nixpacks)

## Repo Structure

```
hybrid-engine-co/
├── package.json          # Root deps + scripts
├── railway.json          # Railway deployment config
├── backend/src/          # All server-side code
│   ├── index.js          # Entry point
│   ├── agents/           # 55 agents across 14 categories
│   ├── pipelines/        # 6 execution pipelines
│   ├── orchestrator/     # Cron loop + pipeline runner
│   ├── fallback/         # 6 fallback chains
│   ├── selfheal/         # Retry + recovery logic
│   ├── limits/           # ElevenLabs + Railway limit tracking
│   ├── niche/            # Brand alignment validation
│   ├── api/routes/       # Express API endpoints
│   ├── db/               # Supabase client + models
│   └── utils/            # Logger, event bus, helpers
├── frontend/             # React dashboard
│   ├── src/pages/        # 6 dashboard pages
│   └── src/components/   # 7 reusable widgets
└── scripts/              # Migration + seed scripts
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd hybrid-engine-co
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your keys

# 3. Run database migration
npm run migrate

# 4. Seed initial data
npm run seed

# 5. Start the engine
npm start
```

## Pipelines

| Pipeline | Purpose |
|---|---|
| Content | Topic → Script → Voice → Video → Upload → Optimize |
| Product | Idea → Generate → Package → Landing Page → Email → Upsell |
| Funnel | Lead Magnet → Funnel → Checkout → Retargeting → A/B Test |
| Affiliate | Links → Assets → Tracking → Payouts → Recruitment |
| Marketplace | Listing → Assets → Publish → Optimize |
| Self-Optimization | Analytics → Detect Weakness → Regenerate → Deploy |

## Key Principles

1. **Never stop** — fallback chains guarantee output even when primary methods fail
2. **Never exceed limits** — ElevenLabs and Railway quotas are tracked with 10% safety buffers
3. **Always publish** — every pipeline produces a deliverable, even if degraded
4. **Always aligned** — NicheValidator enforces brand identity on all content
5. **Always visible** — DashboardAgent feeds real-time metrics to the web UI

## Agents (55 Total)

- **Core Intelligence** (5): BrandBrain, TrendIntelligence, MarketResearch, KnowledgeMemory, SelfOptimization
- **Content + Video** (7): ContentStrategy, ScriptWriter, ThumbnailDesigner, BrollGenerator, Voiceover, VideoAssembly, MultiFormatExport
- **Distribution** (4): Upload, Scheduler, Metadata, PlatformOptimization
- **Product Factory** (5): ProductGenerator, ProductPackaging, ProductLandingPage, ProductEmailSequence, ProductUpsell
- **Funnel Forge** (5): FunnelBuilder, LeadMagnet, CheckoutFlow, Retargeting, ABTesting
- **Affiliate Engine** (6): AffiliateManager, AffiliateTracking, AffiliatePayout, AffiliateAsset, AffiliateRecruitment, AffiliateAnalytics
- **Marketplace** (3): MarketplaceListing, MarketplaceAsset, MarketplaceOptimization
- **Licensing + API** (4): Licensing, Subscription, CreatorAPI, UsageTracking
- **Automation + Infra** (6): QueueWorker, ErrorMonitor, RetryLogic, DependencyUpdate, SecurityAudit, Deployment
- **Advanced AI** (5): HookGenerator, ViralPrediction, AudiencePersona, CompetitorAnalysis, MonetizationStrategy
- **Quality + Accuracy** (3): QualityAssurance, IntellectualIntegrity, Copywriter
- **Legal** (1): Legal
- **Dashboard** (1): Dashboard (CommandCenter)

## License

Proprietary — Hybrid Engine Co.
