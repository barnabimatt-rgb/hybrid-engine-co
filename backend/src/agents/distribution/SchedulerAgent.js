import BaseAgent from '../BaseAgent.js';

export class SchedulerAgent extends BaseAgent {
  constructor() { super('SchedulerAgent', { category: 'distribution' }); }
  async execute(context) {
    this.log.info('Scheduling publication');
    const now = new Date();
    const hours = [9, 12, 17];
    let scheduledHour = hours.find((h) => h > now.getHours()) || hours[0];
    const scheduledDate = new Date(now);
    if (scheduledHour <= now.getHours()) scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(scheduledHour, 0, 0, 0);
    return { schedule: { publishAt: scheduledDate.toISOString(), platform: context.contentFormat === 'youtube_video' ? 'youtube' : 'multi', timezone: 'America/New_York' } };
  }
}
export default SchedulerAgent;
