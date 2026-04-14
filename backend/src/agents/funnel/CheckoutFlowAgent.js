import BaseAgent from '../BaseAgent.js';
import config from '../../config.js';
import { sleep } from '../../utils/helpers.js';

export class CheckoutFlowAgent extends BaseAgent {
  constructor() { super('CheckoutFlowAgent', { category: 'funnel', requiresNetwork: true }); }

  async execute(context) {
    this.log.info('Building checkout flow');
    const price = context.product?.price || 9.99;
    const productName = context.product?.name || context.title || 'Hybrid Engine Product';
    const niche = context.niche || 'hybrid_fitness';

    // If Stripe is configured, create a real checkout session
    if (config.stripe.secretKey) {
      const session = await this._createStripeSession(productName, price, niche, context);
      if (session) {
        return {
          checkout: {
            processor: 'stripe',
            sessionId: session.id,
            url: session.url,
            price: price * 100,
            currency: 'USD',
            status: 'live',
            guaranteeText: '30-Day Money-Back Guarantee',
          },
        };
      }
      this.log.warn('Stripe session creation failed, using draft checkout');
    }

    // Fallback: draft checkout config
    return {
      checkout: {
        processor: 'stripe',
        price: price * 100,
        currency: 'USD',
        fields: ['email', 'name', 'card'],
        orderBump: context.orderBump || null,
        guaranteeText: '30-Day Money-Back Guarantee',
        status: 'draft',
      },
    };
  }

  async _createStripeSession(productName, price, niche, context, retries = 2) {
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('mode', 'payment');
    params.append('success_url', `${config.stripe.successUrl || 'https://hybridengine.co/success'}?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', config.stripe.cancelUrl || 'https://hybridengine.co/cancel');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', productName);
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(price * 100)));
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[source_type]', 'product');
    params.append('metadata[source_name]', productName);
    params.append('metadata[niche]', niche);
    if (context.pipelineRunId) params.append('metadata[source_id]', context.pipelineRunId);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.stripe.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          const err = await response.text().catch(() => '');
          this.log.error({ status: response.status, body: err.slice(0, 200) }, 'Stripe API error');
          if (attempt < retries) { await sleep(Math.pow(2, attempt) * 1000); continue; }
          return null;
        }

        return await response.json();
      } catch (err) {
        this.log.error({ error: err.message, attempt }, 'Stripe call failed');
        if (attempt < retries) await sleep(Math.pow(2, attempt) * 1000);
      }
    }
    return null;
  }
}
export default CheckoutFlowAgent;
