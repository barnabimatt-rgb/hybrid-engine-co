import BaseAgent from '../BaseAgent.js';
import config from '../../config.js';
import { sleep } from '../../utils/helpers.js';

export class MarketplaceListingAgent extends BaseAgent {
  constructor() { super('MarketplaceListingAgent', { category: 'marketplace', requiresNetwork: true }); }

  async execute(context) {
    this.requireContext(context, ['product']);
    this.log.info('Creating marketplace listing');

    const product = context.product;
    const title = product.name || product.title || context.title;
    const description = [
      product.tagline || product.subtitle || '',
      product.description || '',
      '\nBuilt by Hybrid Engine Co.',
    ].filter(Boolean).join('\n');
    const price = Math.round((product.price || 9.99) * 100); // Gumroad uses cents
    const niche = context.niche || 'hybrid_fitness';

    // If Gumroad access token is configured, create a real product listing
    if (config.gumroad.accessToken) {
      const listing = await this._createGumroadProduct(title, description, price, niche, context);
      if (listing) {
        return {
          marketplaceListing: {
            platform: 'gumroad',
            id: listing.product?.id,
            title,
            description,
            price: price / 100,
            url: listing.product?.short_url,
            category: niche === 'data_science' ? 'Education' : 'Health & Fitness',
            tags: [niche, 'hybrid', 'data-driven', context.topic].filter(Boolean),
            status: 'published',
          },
        };
      }
      this.log.warn('Gumroad product creation failed, using draft listing');
    }

    // Fallback: draft listing
    return {
      marketplaceListing: {
        platform: 'gumroad',
        title,
        description,
        price: price / 100,
        category: niche === 'data_science' ? 'Education' : 'Health & Fitness',
        tags: [niche, 'hybrid', 'data-driven', context.topic].filter(Boolean),
        status: 'draft',
      },
    };
  }

  async _createGumroadProduct(name, description, priceCents, niche, context, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const params = new URLSearchParams();
        params.append('access_token', config.gumroad.accessToken);
        params.append('name', name);
        params.append('description', description);
        params.append('price', String(priceCents));
        params.append('preview_url', '');
        if (context.product?.sections) {
          params.append('custom_summary', context.product.sections.map(s => s.title).join(' | '));
        }

        const response = await fetch('https://api.gumroad.com/v2/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        });

        if (response.status === 429) {
          this.log.warn({ attempt }, 'Gumroad rate limited — retrying');
          if (attempt < retries) { await sleep(Math.pow(2, attempt) * 2000); continue; }
          return null;
        }

        if (!response.ok) {
          const err = await response.text().catch(() => '');
          this.log.error({ status: response.status, body: err.slice(0, 200) }, 'Gumroad API error');
          return null;
        }

        const data = await response.json();
        this.log.info({ productId: data.product?.id }, 'Gumroad product created');
        return data;
      } catch (err) {
        this.log.error({ error: err.message, attempt }, 'Gumroad call failed');
        if (attempt < retries) await sleep(Math.pow(2, attempt) * 1000);
      }
    }
    return null;
  }
}
export default MarketplaceListingAgent;
