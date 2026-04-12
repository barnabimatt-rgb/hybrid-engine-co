import BaseAgent from '../BaseAgent.js';
import nicheValidator from '../../niche/NicheValidator.js';

export class IntellectualIntegrityAgent extends BaseAgent {
  constructor() { super('IntellectualIntegrityAgent', { category: 'quality' }); }
  async execute(context) {
    this.log.info('Checking intellectual integrity');
    const content = context.script || context.product?.title || '';
    const boundaries = nicheValidator.validateBoundaries(content);
    const flags = [];
    if (boundaries.violations.length > 0) flags.push(...boundaries.violations);
    if (/\d+%/.test(content) && !content.includes('approximately')) flags.push('Unqualified percentage claim — add source or qualifier');
    return { integrityCheck: { passed: flags.length === 0, flags, disclaimersNeeded: boundaries.disclaimersNeeded, checkedAt: new Date().toISOString() } };
  }
}
export default IntellectualIntegrityAgent;
