// backend/src/niche/NicheConfig.js — Domain definitions, audience, tone, and boundaries

export const NICHES = Object.freeze({
  HYBRID_FITNESS: 'hybrid_fitness',
  DATA_SCIENCE: 'data_science',
  DATA_DRIVEN_FITNESS: 'data_driven_fitness',
  TACTICAL_MINDSET: 'tactical_mindset',
  PRODUCTIVITY: 'productivity',
  DIGITAL_ENTREPRENEURSHIP: 'digital_entrepreneurship',
  VETERAN_TRANSITION: 'veteran_transition',
});

export const NICHE_LABELS = Object.freeze({
  [NICHES.HYBRID_FITNESS]: 'Hybrid Fitness',
  [NICHES.DATA_SCIENCE]: 'Data Science / AI Engineering',
  [NICHES.DATA_DRIVEN_FITNESS]: 'Data-Driven Fitness',
  [NICHES.TACTICAL_MINDSET]: 'Tactical Mindset / Discipline',
  [NICHES.PRODUCTIVITY]: 'Productivity / Systems / Notion',
  [NICHES.DIGITAL_ENTREPRENEURSHIP]: 'Digital Entrepreneurship / Passive Income',
  [NICHES.VETERAN_TRANSITION]: 'Veteran Transition / Tactical Career Systems',
});

export const PRIMARY_NICHES = [NICHES.HYBRID_FITNESS, NICHES.DATA_SCIENCE];
export const SIGNATURE_NICHE = NICHES.DATA_DRIVEN_FITNESS;
export const SUPPORTING_NICHES = [
  NICHES.TACTICAL_MINDSET,
  NICHES.PRODUCTIVITY,
  NICHES.DIGITAL_ENTREPRENEURSHIP,
  NICHES.VETERAN_TRANSITION,
];
export const ALL_NICHES = [...PRIMARY_NICHES, SIGNATURE_NICHE, ...SUPPORTING_NICHES];

export const AUDIENCES = Object.freeze([
  'aspiring data scientists',
  'hybrid athletes',
  'tactical athletes',
  'runners',
  'fitness enthusiasts',
  'people using data to improve training',
  'people using AI to improve fitness',
  'people using systems to improve life',
  'veterans transitioning careers',
]);

export const BRAND_TONE = Object.freeze([
  'intelligent', 'practical', 'data-driven', 'fitness-focused',
  'tactical', 'disciplined', 'structured', 'high-performance',
  'simple', 'clear', 'no fluff',
]);

export const CONTENT_BOUNDARIES = Object.freeze({
  forbidden: [
    'medical claims',
    'extreme diet claims',
    'unsafe fitness advice',
    'unverified data science claims',
    'hallucinated statistics',
    'misleading technical explanations',
    'health diagnosis',
    'drug recommendations',
    'guaranteed income claims',
    'specific financial returns',
  ],
  requiredDisclaimers: [
    { trigger: 'fitness', disclaimer: 'Consult a healthcare professional before starting any fitness program.' },
    { trigger: 'income', disclaimer: 'Results vary. No income is guaranteed.' },
    { trigger: 'supplement', disclaimer: 'This is not medical advice. Consult your doctor.' },
  ],
});

export const NICHE_KEYWORDS = Object.freeze({
  [NICHES.HYBRID_FITNESS]: ['workout', 'training', 'fitness', 'strength', 'cardio', 'running', 'hybrid', 'athlete', 'exercise', 'endurance', 'mobility', 'conditioning'],
  [NICHES.DATA_SCIENCE]: ['data', 'python', 'machine learning', 'AI', 'analytics', 'statistics', 'model', 'algorithm', 'neural', 'deep learning', 'sql', 'pandas', 'tensorflow'],
  [NICHES.DATA_DRIVEN_FITNESS]: ['wearable', 'heart rate', 'VO2', 'tracking', 'metrics', 'performance data', 'training load', 'recovery score', 'garmin', 'whoop', 'strava'],
  [NICHES.TACTICAL_MINDSET]: ['discipline', 'mindset', 'tactical', 'mental toughness', 'grit', 'stoic', 'resilience', 'focus', 'habits'],
  [NICHES.PRODUCTIVITY]: ['productivity', 'systems', 'notion', 'template', 'workflow', 'automation', 'schedule', 'time management', 'second brain'],
  [NICHES.DIGITAL_ENTREPRENEURSHIP]: ['passive income', 'digital product', 'online business', 'side hustle', 'monetize', 'funnel', 'email list', 'creator economy'],
  [NICHES.VETERAN_TRANSITION]: ['veteran', 'military', 'transition', 'career change', 'GI Bill', 'tactical career', 'service member', 'civilian'],
});
