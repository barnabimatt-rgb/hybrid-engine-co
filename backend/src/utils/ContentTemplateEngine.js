// backend/src/utils/ContentTemplateEngine.js — Niche-aware content generation
import { NICHES, NICHE_KEYWORDS, NICHE_LABELS, BRAND_TONE, AUDIENCES, CONTENT_BOUNDARIES } from '../niche/NicheConfig.js';
import { pickRandom } from './helpers.js';

const HOOK_PATTERNS = {
  [NICHES.HYBRID_FITNESS]: [
    'I tracked every {topic} session for 90 days. Here is what the data revealed.',
    'Most hybrid athletes ignore {topic}. That is a costly mistake.',
    'The {topic} protocol that changed my training forever.',
    'Why {topic} is the missing piece in your hybrid training stack.',
    'I analyzed 50 top athletes and their {topic} approach. Pattern found.',
    'Stop guessing with {topic}. Here is the data-driven framework.',
    '{topic} is not what you think. The science says otherwise.',
    'The 80/20 rule of {topic} that elite athletes use daily.',
    'Your {topic} routine is broken. Here is how to fix it with data.',
    'What happens when you apply data science to {topic}? I tested it.',
  ],
  [NICHES.DATA_SCIENCE]: [
    'I built a {topic} pipeline in Python. Here is every step.',
    'The {topic} technique senior data scientists never skip.',
    'Why your {topic} workflow is 10x slower than it should be.',
    '{topic} from scratch: no fluff, just working code.',
    'The {topic} framework that landed me three job offers.',
    'Most tutorials get {topic} wrong. Here is the production-ready way.',
    'I automated {topic} with 47 lines of Python. Full walkthrough.',
    'The {topic} mistake that costs data teams thousands of hours.',
    '{topic}: the practical guide nobody wrote until now.',
    'From zero to deployed: {topic} in under 30 minutes.',
  ],
  [NICHES.DATA_DRIVEN_FITNESS]: [
    'I combined {topic} with wearable data. The results were shocking.',
    'Your Garmin knows more about {topic} than your coach. Here is proof.',
    'How to use {topic} data to train smarter, not harder.',
    'The {topic} dashboard I built to optimize my training.',
    'Heart rate, HRV, and {topic}: the complete data playbook.',
    '{topic} analytics: what your watch data actually means.',
    'I tracked {topic} for 6 months. Here is the performance curve.',
    'The data says your {topic} approach needs an overhaul.',
    'Build a {topic} tracking system with Python and your wearable.',
    'VO2 max, training load, and {topic}: a data scientist approach.',
  ],
  [NICHES.TACTICAL_MINDSET]: [
    'The {topic} discipline framework used by special operations.',
    'Mental toughness and {topic}: the tactical approach.',
    '{topic} requires grit. Here is the system to build it.',
    'The stoic approach to {topic} that changes everything.',
    'Discipline beats motivation for {topic}. Here is the proof.',
    'The military-grade {topic} protocol for high performers.',
  ],
  [NICHES.PRODUCTIVITY]: [
    'The {topic} Notion system that runs my entire workflow.',
    'I automated {topic} and saved 10 hours per week.',
    'The {topic} template that organizes everything.',
    'Build a {topic} second brain in 20 minutes.',
    'The {topic} system that eliminates decision fatigue.',
    'Stop overcomplicating {topic}. Here is the minimal system.',
  ],
  [NICHES.DIGITAL_ENTREPRENEURSHIP]: [
    'How I turned {topic} into a passive income stream.',
    'The {topic} funnel that generates revenue on autopilot.',
    '{topic}: from idea to first sale in 48 hours.',
    'The {topic} product that sells while you sleep.',
    'I built a {topic} business with zero ad spend. Here is how.',
    'The {topic} monetization strategy most creators miss.',
  ],
  [NICHES.VETERAN_TRANSITION]: [
    'How {topic} translates from military to civilian careers.',
    'The {topic} framework every transitioning veteran needs.',
    '{topic} for veterans: leveraging your tactical background.',
    'From service to {topic}: the career transition playbook.',
    'Military {topic} skills that employers actually want.',
    'The GI Bill and {topic}: maximize your benefits.',
  ],
};

const SCRIPT_STRUCTURES = {
  'problem-solution': {
    build(ctx) {
      const { topic, niche, hook, audience } = ctx;
      const nicheLabel = NICHE_LABELS[niche] || 'performance';
      return [
        hook,
        '',
        `Here is the problem. Most people approach ${topic} the wrong way. They follow generic advice, ignore the data, and wonder why they plateau.`,
        '',
        `In ${nicheLabel}, this costs you weeks — sometimes months — of wasted effort. Whether you are ${audience || 'building your system'}, the stakes are real.`,
        '',
        `The solution is a structured, data-driven framework. Here is how it works:`,
        '',
        `Step one: Audit your current ${topic} approach. What are you actually measuring? If the answer is nothing, that is your first problem.`,
        '',
        `Step two: Set baseline metrics. You cannot improve what you do not track. Pick 2-3 key indicators that matter for ${topic}.`,
        '',
        `Step three: Run a 30-day experiment. Change one variable, track the results, and let the data tell you what works.`,
        '',
        `Step four: Iterate. Double down on what moves the needle. Cut what does not. This is how you build a system, not just a habit.`,
        '',
        `The key insight: ${topic} is not about motivation. It is about building a repeatable system backed by evidence.`,
        '',
        `If this framework resonated, drop a like and subscribe. I break down ${nicheLabel} systems every week.`,
        `Link in the description for the full guide and templates.`,
      ].join('\n');
    },
  },
  'listicle': {
    build(ctx) {
      const { topic, niche, hook, audience } = ctx;
      const keywords = NICHE_KEYWORDS[niche] || [];
      const items = keywords.slice(0, 5);
      return [
        hook,
        '',
        `Here are 5 ${topic} principles that actually work — backed by data, not bro science.`,
        '',
        ...items.map((kw, i) => [
          `Number ${i + 1}: ${kw.charAt(0).toUpperCase() + kw.slice(1)}.`,
          `Most people overlook ${kw} when it comes to ${topic}. But the data shows it is one of the highest-leverage factors you can optimize. Start tracking it this week.`,
          '',
        ]).flat(),
        `Those are the 5 pillars. Master these and ${topic} becomes a system, not a struggle.`,
        '',
        `Subscribe for more data-driven breakdowns. Link in bio for the complete framework.`,
      ].join('\n');
    },
  },
  'how-to': {
    build(ctx) {
      const { topic, niche, hook } = ctx;
      const nicheLabel = NICHE_LABELS[niche] || 'performance';
      return [
        hook,
        '',
        `Today I am walking you through exactly how to master ${topic} — step by step. No fluff.`,
        '',
        `This applies whether you are a complete beginner or you have been in ${nicheLabel} for years. The framework scales.`,
        '',
        `Step 1: Define your objective. What does success with ${topic} look like in 30 days? Be specific. Write it down.`,
        '',
        `Step 2: Gather your tools. For ${topic}, you need a tracking method and a feedback loop. I recommend starting simple — a spreadsheet works.`,
        '',
        `Step 3: Execute the baseline week. Do not change anything yet. Just track your current ${topic} performance. This is your starting line.`,
        '',
        `Step 4: Analyze and adjust. Look at your baseline data. Where are the gaps? What is the one variable that would make the biggest impact?`,
        '',
        `Step 5: Implement one change. Just one. Run it for two weeks. Measure the difference. This is how real progress works — one variable at a time.`,
        '',
        `Step 6: Stack and scale. Once that change is locked in, add the next one. This compound effect is what separates amateurs from professionals in ${nicheLabel}.`,
        '',
        `That is the complete system. If you want the templates and tracking sheets I use, link is in the description.`,
        '',
        `Like, subscribe, and I will see you in the next one.`,
      ].join('\n');
    },
  },
  'data-walkthrough': {
    build(ctx) {
      const { topic, niche, hook } = ctx;
      return [
        hook,
        '',
        `Let me show you exactly what the data says about ${topic}. I pulled real numbers and the patterns are clear.`,
        '',
        `First, the methodology. I collected data over 90 days, tracking key metrics related to ${topic}. Sample size matters, and so does consistency.`,
        '',
        `Here is finding number one: The top performers in ${topic} share a common pattern — they track obsessively but optimize conservatively. Small changes, big results.`,
        '',
        `Finding two: There is a clear inflection point around week 6. If you stick with a ${topic} system past that mark, your results compound noticeably.`,
        '',
        `Finding three: The variable most people ignore — recovery and reflection — turned out to be the highest-correlated factor with long-term ${topic} improvement.`,
        '',
        `What does this mean for you? Stop chasing quick fixes. Build a 90-day ${topic} system, track your metrics, and trust the process.`,
        '',
        `The data does not lie. And neither does this channel. Subscribe for more breakdowns like this.`,
        '',
        `Full dataset and analysis framework linked below.`,
      ].join('\n');
    },
  },
};

const PRODUCT_TEMPLATES = {
  ebook: {
    build(ctx) {
      const { topic, niche } = ctx;
      const nicheLabel = NICHE_LABELS[niche] || 'Performance';
      return {
        type: 'ebook',
        title: `The ${topic} Blueprint`,
        subtitle: `A data-driven guide to mastering ${topic} — by Hybrid Engine Co.`,
        estimatedPages: 25,
        chapters: [
          { title: 'Introduction: Why Data Changes Everything', summary: `How a systematic approach to ${topic} outperforms guesswork every time.` },
          { title: `The ${nicheLabel} Framework`, summary: `The core methodology for integrating ${topic} into your system.` },
          { title: 'Baseline Assessment', summary: `How to measure your current ${topic} performance and identify gaps.` },
          { title: 'The 30-Day Protocol', summary: `A step-by-step ${topic} implementation plan with daily actions.` },
          { title: 'Tracking and Metrics', summary: `The exact metrics to track and how to build your ${topic} dashboard.` },
          { title: 'Advanced Optimization', summary: `How to use data analysis to refine your ${topic} approach over time.` },
          { title: 'Templates and Tools', summary: `Ready-to-use templates, spreadsheets, and checklists for ${topic}.` },
          { title: 'Action Plan', summary: `Your personalized ${topic} roadmap for the next 90 days.` },
        ],
      };
    },
  },
  checklist: {
    build(ctx) {
      const { topic, niche } = ctx;
      return {
        type: 'checklist',
        title: `The ${topic} Checklist`,
        subtitle: `Your daily and weekly ${topic} action items.`,
        estimatedPages: 5,
        items: [
          `Define your primary ${topic} goal for this quarter`,
          `Set up your ${topic} tracking system (spreadsheet or app)`,
          `Complete a baseline assessment of current ${topic} performance`,
          `Identify the top 3 variables to optimize`,
          `Schedule weekly ${topic} review sessions`,
          `Track daily metrics for at least 7 consecutive days`,
          `Analyze week 1 data and identify one change to make`,
          `Implement single-variable change for weeks 2-3`,
          `Compare results against baseline at day 21`,
          `Document findings and adjust system`,
          `Share results with accountability partner or community`,
          `Plan next 30-day ${topic} cycle`,
        ],
      };
    },
  },
  template: {
    build(ctx) {
      const { topic } = ctx;
      return {
        type: 'template',
        title: `The ${topic} System Template`,
        subtitle: `Plug-and-play frameworks for ${topic}.`,
        estimatedPages: 8,
        sections: [
          { title: 'Goal Setting Template', content: `SMART goal framework customized for ${topic}` },
          { title: 'Daily Tracker', content: `Track key ${topic} metrics each day` },
          { title: 'Weekly Review Sheet', content: `Analyze your ${topic} progress and plan next steps` },
          { title: 'Monthly Dashboard', content: `Visualize your ${topic} trends over time` },
          { title: 'Decision Matrix', content: `Data-driven framework for ${topic} decisions` },
        ],
      };
    },
  },
  worksheet: {
    build(ctx) {
      const { topic } = ctx;
      return {
        type: 'worksheet',
        title: `The ${topic} Worksheet`,
        subtitle: `Hands-on exercises to master ${topic}.`,
        estimatedPages: 6,
        exercises: [
          { prompt: `List your top 3 ${topic} goals and rank them by impact.`, purpose: 'Prioritization' },
          { prompt: `What are you currently measuring about ${topic}? What should you be measuring?`, purpose: 'Gap analysis' },
          { prompt: `Describe your ideal ${topic} outcome in 90 days. Be specific.`, purpose: 'Vision setting' },
          { prompt: `What is the single biggest obstacle to your ${topic} progress right now?`, purpose: 'Obstacle identification' },
          { prompt: `Design a simple experiment to test one ${topic} variable this week.`, purpose: 'Experimentation' },
        ],
      };
    },
  },
  course_outline: {
    build(ctx) {
      const { topic, niche } = ctx;
      return {
        type: 'course_outline',
        title: `Master ${topic}: The Complete System`,
        subtitle: `From beginner to advanced in ${topic}.`,
        estimatedPages: 4,
        modules: [
          { module: 1, title: `${topic} Foundations`, lessons: ['Core concepts', 'Common mistakes', 'Mindset shift required'], duration: '45 min' },
          { module: 2, title: 'Building Your System', lessons: ['Tool selection', 'Tracking setup', 'Baseline assessment'], duration: '60 min' },
          { module: 3, title: 'The 30-Day Protocol', lessons: ['Week 1: Observe', 'Week 2-3: Optimize', 'Week 4: Consolidate'], duration: '90 min' },
          { module: 4, title: 'Data Analysis', lessons: ['Reading your metrics', 'Pattern recognition', 'Decision framework'], duration: '60 min' },
          { module: 5, title: 'Advanced Strategies', lessons: ['Stacking variables', 'Periodization', 'Long-term scaling'], duration: '75 min' },
        ],
      };
    },
  },
  notion_template: {
    build(ctx) {
      const { topic } = ctx;
      return {
        type: 'notion_template',
        title: `${topic} Command Center`,
        subtitle: `Your all-in-one Notion workspace for ${topic}.`,
        estimatedPages: 3,
        databases: [
          { name: `${topic} Tracker`, properties: ['Date', 'Metric 1', 'Metric 2', 'Notes', 'Score'], views: ['Table', 'Calendar', 'Chart'] },
          { name: 'Goal Board', properties: ['Goal', 'Status', 'Deadline', 'Progress %', 'Priority'], views: ['Board', 'Timeline'] },
          { name: 'Resource Library', properties: ['Title', 'Type', 'Category', 'Rating', 'URL'], views: ['Gallery', 'Table'] },
        ],
        pages: ['Dashboard', 'Weekly Review', 'Monthly Report', 'Experiment Log'],
      };
    },
  },
};

const PRICING = {
  ebook: 1997,
  checklist: 497,
  template: 997,
  worksheet: 697,
  course_outline: 2997,
  notion_template: 1497,
};

export class ContentTemplateEngine {
  generateHook(topic, niche) {
    const patterns = HOOK_PATTERNS[niche] || HOOK_PATTERNS[NICHES.HYBRID_FITNESS];
    const pattern = pickRandom(patterns);
    return pattern.replace(/\{topic\}/g, topic);
  }

  generateHooks(topic, niche, count = 5) {
    const patterns = HOOK_PATTERNS[niche] || HOOK_PATTERNS[NICHES.HYBRID_FITNESS];
    const shuffled = [...patterns].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((p) => p.replace(/\{topic\}/g, topic));
  }

  generateScript(context) {
    const { topic, niche, contentFormat } = context;
    const audience = pickRandom(AUDIENCES);
    const structureNames = Object.keys(SCRIPT_STRUCTURES);
    const structureName = pickRandom(structureNames);
    const structure = SCRIPT_STRUCTURES[structureName];
    const hook = this.generateHook(topic, niche);
    const script = structure.build({ topic, niche, hook, audience, contentFormat });
    return {
      script,
      scriptCharCount: script.length,
      hook,
      structureType: structureName,
      estimatedDuration: Math.ceil(script.length / 15),
    };
  }

  generateProduct(context) {
    const { topic, niche } = context;
    const types = Object.keys(PRODUCT_TEMPLATES);
    const type = context.productType || pickRandom(types);
    const template = PRODUCT_TEMPLATES[type] || PRODUCT_TEMPLATES.ebook;
    const product = template.build({ topic, niche });
    product.niche = niche;
    product.price = PRICING[type] || 997;
    return product;
  }

  generateEmailSequence(context) {
    const { topic, niche } = context;
    const productTitle = context.product?.title || `The ${topic} Blueprint`;
    const nicheLabel = NICHE_LABELS[niche] || 'performance';
    return [
      {
        day: 0, subject: `Your ${productTitle} is ready — start here`, type: 'delivery',
        body: `Welcome! Your copy of ${productTitle} is attached below.\n\nHere is my recommendation: do not try to consume everything at once. Start with Chapter 1, complete the baseline assessment, and reply to this email with your results.\n\nThis is not just a download — it is a system. And systems work best when you engage with them.\n\nTalk soon,\nHybrid Engine Co.`,
      },
      {
        day: 1, subject: `Quick win: your first ${topic} action item`, type: 'onboarding',
        body: `Most people download a product and never open it. You are not most people.\n\nHere is your Day 1 action: Open ${productTitle} to the tracking template. Fill in your current baseline numbers. It takes 5 minutes.\n\nWhy? Because you cannot improve ${topic} without knowing where you stand right now. The data is your starting line.\n\nDo this today and you are already ahead of 90% of people who bought this guide.`,
      },
      {
        day: 3, subject: `The #1 mistake people make with ${topic}`, type: 'value',
        body: `After working with hundreds of people on ${topic}, I see the same pattern:\n\nThey change too many variables at once.\n\nIt feels productive. But it makes your data useless. You cannot tell what worked.\n\nThe fix: One variable. Two weeks. Measure the delta.\n\nThis is the core principle in ${productTitle}, and it applies to everything in ${nicheLabel}. Simple beats complex when you are building systems.`,
      },
      {
        day: 5, subject: `How is your ${topic} progress?`, type: 'engagement',
        body: `Quick check-in. By now you should have:\n\n- Your baseline numbers recorded\n- One variable identified to optimize\n- At least 3 days of tracking data\n\nIf you are on track, great. Keep going. The inflection point is usually around day 14.\n\nIf you have not started yet — no judgment. Reply to this email and tell me what is blocking you. I read every response.`,
      },
      {
        day: 7, subject: `Level up: advanced ${topic} strategies`, type: 'upsell',
        body: `You have been working with ${productTitle} for a week now. If you have been following the system, you should be seeing early signals in your data.\n\nReady for the next level? I put together an advanced ${nicheLabel} masterclass that goes deeper:\n\n- Advanced data analysis techniques for ${topic}\n- Periodization and variable stacking\n- Long-term system design\n\nIt is the natural next step after ${productTitle}. Check it out below.`,
      },
    ];
  }

  generateLandingPage(context) {
    const { topic, niche } = context;
    const productTitle = context.product?.title || `The ${topic} Blueprint`;
    const price = context.product?.price || 997;
    const nicheLabel = NICHE_LABELS[niche] || 'performance';
    return {
      headline: `Master ${topic} with a Data-Driven System`,
      subheadline: `The complete ${nicheLabel} framework used by high performers who refuse to guess.`,
      hero: `Stop wasting time on generic ${topic} advice. This system gives you the exact metrics to track, the protocol to follow, and the templates to execute — all backed by data.`,
      problem: [
        `You have tried multiple approaches to ${topic} but results are inconsistent.`,
        `You are overwhelmed by conflicting advice and do not know what actually works.`,
        `You lack a systematic way to track progress and make data-driven decisions.`,
        `You plateau because you change too many variables without measuring impact.`,
      ],
      solution: `${productTitle} gives you a proven, repeatable system. Track the right metrics, optimize one variable at a time, and let the data guide your decisions.`,
      features: [
        { title: 'Step-by-Step Protocol', desc: `A 30-day ${topic} implementation plan with daily actions.` },
        { title: 'Tracking Templates', desc: 'Ready-to-use spreadsheets and dashboards for your metrics.' },
        { title: 'Data Analysis Framework', desc: `Learn to read your ${topic} data and make smart adjustments.` },
        { title: 'Community Access', desc: 'Join other data-driven performers optimizing their systems.' },
        { title: 'Lifetime Updates', desc: 'Get every future update to the system at no extra cost.' },
      ],
      pricing: { amount: price, display: `$${(price / 100).toFixed(2)}`, anchor: `$${((price * 3) / 100).toFixed(2)}` },
      faq: [
        { q: `Who is this for?`, a: `Anyone serious about ${topic} who wants a systematic, data-driven approach instead of guessing.` },
        { q: 'How long until I see results?', a: 'Most people see measurable changes within 30 days of following the protocol consistently.' },
        { q: 'Do I need technical skills?', a: 'No. The templates and trackers are beginner-friendly. If you can use a spreadsheet, you are set.' },
        { q: 'Is there a refund policy?', a: 'Yes. 30-day money-back guarantee. If the system does not work for you, full refund, no questions.' },
        { q: 'What format is the product?', a: 'Digital download — PDF guide, spreadsheet templates, and Notion workspace (if applicable).' },
      ],
      ctaText: 'Get Instant Access',
      style: 'dark_tactical',
    };
  }
}

const contentTemplateEngine = new ContentTemplateEngine();
export default contentTemplateEngine;
