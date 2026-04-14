// backend/src/api/routes/webhooks.js — Payment and platform webhooks
import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import Revenue from '../../db/models/Revenue.js';
import config from '../../config.js';
import { createLogger } from '../../utils/logger.js';
import eventBus, { Events } from '../../utils/eventBus.js';

const log = createLogger('api:webhooks');
const router = Router();

function verifyStripeSignature(payload, sigHeader, secret) {
  if (!secret || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(p => { const [k, v] = p.split('='); return [k, v]; }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Reject if timestamp is older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (Math.abs(age) > 300) return false;

  const signed = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  try {
    return timingSafeEqual(Buffer.from(signed), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Stripe webhook — expects raw body for signature verification
router.post('/stripe', async (req, res) => {
  try {
    // Verify signature if webhook secret is configured
    if (config.stripe.webhookSecret) {
      const sig = req.headers['stripe-signature'];
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!verifyStripeSignature(rawBody, sig, config.stripe.webhookSecret)) {
        log.warn('Stripe webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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
