import BaseAgent from '../BaseAgent.js';
import nicheValidator from '../../niche/NicheValidator.js';

export class QualityAssuranceAgent extends BaseAgent {
  constructor() { super('QualityAssuranceAgent', { category: 'quality' }); }
  async execute(context) {
    this.log.info('Running quality assurance');
    const contentToCheck = [context.script, context.title, context.product?.title, context.landingPage?.headline].filter(Boolean).join(' ');
    const validation = nicheValidator.validate(contentToCheck);
    if (!validation.passed) {
      this.log.warn({ issues: validation.alignment.issues, violations: validation.boundaries.violations }, 'QA issues found');
    }
    return { qaResult: { passed: validation.passed, alignment: validation.alignment, boundaries: validation.boundaries, checkedAt: new Date().toISOString() } };
  }
}
export default QualityAssuranceAgent;
