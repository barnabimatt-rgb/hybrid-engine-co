import BaseAgent from '../BaseAgent.js';

export class BrollGeneratorAgent extends BaseAgent {
  constructor() { super('BrollGeneratorAgent', { category: 'content' }); }
  async execute(context) {
    this.log.info('Generating B-roll list');
    const niche = context.niche || 'hybrid_fitness';
    const brollMap = {
      hybrid_fitness: ['gym_training', 'running_outdoor', 'kettlebell_swing', 'stretching'],
      data_science: ['code_screen', 'dashboard_view', 'data_viz', 'terminal_typing'],
      data_driven_fitness: ['smartwatch_data', 'gym_with_metrics', 'heart_rate_graph', 'training_log'],
      tactical_mindset: ['morning_routine', 'journaling', 'cold_exposure', 'meditation'],
      productivity: ['notion_workspace', 'calendar_planning', 'desk_setup', 'checklist'],
      digital_entrepreneurship: ['laptop_cafe', 'analytics_dashboard', 'email_marketing', 'product_launch'],
      veteran_transition: ['military_to_civilian', 'interview_prep', 'resume_writing', 'networking'],
    };
    return {
      brollClips: (brollMap[niche] || brollMap.hybrid_fitness).map((clip, i) => ({ id: `broll_${i}`, name: clip, duration: 3, source: 'stock_library' })),
    };
  }
}
export default BrollGeneratorAgent;
