import BaseAgent from '../BaseAgent.js';

export class LegalAgent extends BaseAgent {
  constructor() { super('LegalAgent', { category: 'legal' }); }
  async execute(context) {
    this.log.info('Legal compliance check');
    const issues = [];
    const content = context.script || '';
    if (/guaranteed? (income|results|money)/i.test(content)) issues.push('Income guarantee claim — must be removed');
    if (/cure[sd]?|treat[sd]?|heal[sd]?/i.test(content) && /disease|cancer|diabetes/i.test(content)) issues.push('Medical claim — must be removed');
    const disclaimers = [];
    if (content.toLowerCase().includes('fitness')) disclaimers.push('Consult a healthcare professional before starting any fitness program.');
    if (content.toLowerCase().includes('income') || content.toLowerCase().includes('passive')) disclaimers.push('Results vary. No income is guaranteed.');
    return { legalReview: { compliant: issues.length === 0, issues, disclaimers, termsOfService: '/legal/terms', privacyPolicy: '/legal/privacy', checkedAt: new Date().toISOString() } };
  }
}
export default LegalAgent;
