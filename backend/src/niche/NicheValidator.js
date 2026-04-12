// backend/src/niche/NicheValidator.js — Validates content aligns with niche identity
import { ALL_NICHES, NICHE_KEYWORDS, CONTENT_BOUNDARIES } from './NicheConfig.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('niche:validator');

export class NicheValidator {
  validateAlignment(content) {
    const lower = (content || '').toLowerCase();
    const issues = [];
    const matchedNiches = [];
    let totalScore = 0;

    for (const niche of ALL_NICHES) {
      const keywords = NICHE_KEYWORDS[niche] || [];
      const hits = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
      if (hits.length > 0) {
        matchedNiches.push(niche);
        totalScore += hits.length;
      }
    }

    if (matchedNiches.length === 0) {
      issues.push('Content does not align with any recognized niche');
    }

    return { valid: matchedNiches.length > 0, matchedNiches, score: totalScore, issues };
  }

  validateBoundaries(content) {
    const lower = (content || '').toLowerCase();
    const violations = [];
    const disclaimersNeeded = [];

    for (const forbidden of CONTENT_BOUNDARIES.forbidden) {
      const keywords = forbidden.toLowerCase().split(' ');
      if (keywords.every((kw) => lower.includes(kw))) {
        violations.push(`Potential forbidden content: "${forbidden}"`);
      }
    }

    const dangerPatterns = [
      { pattern: /lose \d+ pounds? in \d+ (day|week)/i, reason: 'Extreme weight loss claim' },
      { pattern: /guaranteed? (income|results|returns)/i, reason: 'Guaranteed results claim' },
      { pattern: /cure[sd]?\s+(cancer|diabetes|disease)/i, reason: 'Medical cure claim' },
      { pattern: /no doctor|skip (the )?doctor/i, reason: 'Anti-medical-advice' },
      { pattern: /\d+% (accuracy|return|success)/i, reason: 'Potentially unverified statistic' },
    ];

    for (const { pattern, reason } of dangerPatterns) {
      if (pattern.test(content || '')) {
        violations.push(reason);
      }
    }

    for (const { trigger, disclaimer } of CONTENT_BOUNDARIES.requiredDisclaimers) {
      if (lower.includes(trigger.toLowerCase())) {
        disclaimersNeeded.push(disclaimer);
      }
    }

    return { clean: violations.length === 0, violations, disclaimersNeeded: [...new Set(disclaimersNeeded)] };
  }

  validate(content) {
    const alignment = this.validateAlignment(content);
    const boundaries = this.validateBoundaries(content);
    const passed = alignment.valid && boundaries.clean;

    if (!passed) {
      log.warn({ alignmentIssues: alignment.issues, boundaryViolations: boundaries.violations }, 'Content validation failed');
    }

    return { passed, alignment, boundaries };
  }

  detectNiche(topic) {
    const result = this.validateAlignment(topic);
    if (result.matchedNiches.length > 0) return result.matchedNiches[0];
    return 'hybrid_fitness';
  }
}

const nicheValidator = new NicheValidator();
export default nicheValidator;
