// backend/src/utils/EmailService.js — Email store-and-send service
import Asset from '../db/models/Asset.js';
import { createLogger } from './logger.js';

const log = createLogger('utils:email');

class EmailService {
  /**
   * Store an email sequence as assets so they're visible in the dashboard.
   * If an email transport is configured in the future, this is the place to wire it.
   */
  async storeSequence(emails, context = {}) {
    const stored = [];
    for (const email of emails) {
      const asset = await Asset.create({
        pipelineRunId: context.pipelineRunId || null,
        assetType: 'email',
        title: email.subject || `Email Day ${email.day}`,
        platform: 'email',
        niche: context.niche || null,
        metadata: {
          day: email.day,
          subject: email.subject,
          body: email.body,
          cta: email.cta,
          sequenceType: context.sequenceType || 'post_purchase',
          productName: context.product?.name || context.title,
        },
      });
      stored.push(asset);
    }
    log.info({ count: stored.length, product: context.product?.name }, 'Email sequence stored');
    return stored;
  }

  /**
   * Store a single email as an asset.
   */
  async storeSingle(email, context = {}) {
    const asset = await Asset.create({
      pipelineRunId: context.pipelineRunId || null,
      assetType: 'email',
      title: email.subject || 'Email',
      platform: 'email',
      niche: context.niche || null,
      metadata: {
        subject: email.subject,
        body: email.body,
        cta: email.cta,
        recipient: email.recipient || null,
      },
    });
    log.info({ subject: email.subject }, 'Email stored');
    return asset;
  }
}

const emailService = new EmailService();
export default emailService;
