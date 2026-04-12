import BaseAgent from '../BaseAgent.js';

export class ProductPackagingAgent extends BaseAgent {
  constructor() { super('ProductPackagingAgent', { category: 'product' }); }
  async execute(context) {
    this.requireContext(context, ['product']);
    this.log.info('Packaging product');
    return { packaging: { format: context.product.type === 'ebook' ? 'pdf' : 'zip', includes: ['main_product', 'bonus_checklist', 'resource_links'], deliveryMethod: 'instant_download', fileSize: `${Math.floor(Math.random() * 5 + 1)}MB` } };
  }
}
export default ProductPackagingAgent;
