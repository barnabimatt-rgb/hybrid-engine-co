// backend/src/api/routes/webhooks.js — Payment and platform webhooks
import { Router } from 'express';
import Revenue from '../../db/models/Revenue.js';
import { createLogger } from '../../utils/logger.js';
import eventBus, { Events } from '../../utils/eventBus.js';

const log = createLogger('api:webhooks');
const router = Router();

// Stripe webhook
router.post('/stripe', async (req, res) => {
  try {
    const event = req.body;
    log.info({ type: event.type }, 'Stripe webhook received');

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const amount = event.data?.object?.amount_total || event.data?.object?.amount || 0;
      const metadata = event.data?.object?.metadata || {};

      await Revenue.record({
        sourceType: metadata.source_type || 'product',
        sourceId: metadata.source_id || null,
        sourceName: metadata.source_name || null,
        amountCents: amount,
        niche: metadata.niche || null,
        metadata: { stripeEvent: event.type, stripeId: event.id },
      });

      eventBus.emit(Events.REVENUE_RECORDED, { amount, source: 'stripe' });
      log.info({ amount }, 'Revenue recorded from Stripe');
    }

    res.json({ received: true });
  } catch (err) {
    log.error({ error: err.message }, 'Stripe webhook error');
    res.status(400).json({ error: err.message });
  }
});

// Gumroad webhook
router.post('/gumroad', async (req, res) => {
  try {
    const data = req.body;
    log.info({ productName: data.product_name }, 'Gumroad webhook received');

    const amount = Math.round((parseFloat(data.price) || 0) * 100);

    await Revenue.record({
      sourceType: 'marketplace',
      sourceId: data.product_id || null,
      sourceName: data.product_name || null,
      amountCents: amount,
      niche: null,
      metadata: { platform: 'gumroad', email: data.email },
    });

    eventBus.emit(Events.REVENUE_RECORDED, { amount, source: 'gumroad' });
    res.json({ received: true });
  } catch (err) {
    log.error({ error: err.message }, 'Gumroad webhook error');
    res.status(400).json({ error: err.message });
  }
});

export default router;
