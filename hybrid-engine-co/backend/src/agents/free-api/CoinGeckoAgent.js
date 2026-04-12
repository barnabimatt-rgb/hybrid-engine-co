// CoinGeckoAgent — Crypto market data for digital asset content
// API: https://api.coingecko.com/api/v3  |  Auth: NONE  |  Rate: 30/min  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class CoinGeckoAgent extends FreeApiBase {
  constructor() {
    super('CoinGeckoAgent', {
      baseUrl: 'https://api.coingecko.com',
      authMethod: 'none',
      rateLimit: 25,
      timeoutMs: 10000,
      category: 'finance',
    });
  }

  healthEndpoint() { return '/api/v3/ping'; }

  async execute(context) {
    this.log.info('Fetching crypto market data');
    const coins = context.coins || 'bitcoin,ethereum,solana';

    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/api/v3/coins/markets', {
        vs_currency: 'usd', ids: coins, order: 'market_cap_desc',
        per_page: 10, page: 1, sparkline: false,
        price_change_percentage: '24h,7d',
      });
    });
  }

  transform(raw) {
    const coins = (Array.isArray(raw) ? raw : []).map((c) => ({
      id: c.id, symbol: c.symbol, name: c.name,
      price: c.current_price, marketCap: c.market_cap,
      volume24h: c.total_volume,
      change24h: c.price_change_percentage_24h,
      change7d: c.price_change_percentage_7d_in_currency,
      high24h: c.high_24h, low24h: c.low_24h,
      image: c.image,
    }));
    return { crypto: { coins, count: coins.length }, source: this.name, fetchedAt: new Date().toISOString() };
  }

  getFallbackData() {
    return { crypto: { coins: [], count: 0 }, source: this.name, fallback: true, fetchedAt: new Date().toISOString() };
  }
}
export default CoinGeckoAgent;
