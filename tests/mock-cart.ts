import { Page } from '@playwright/test';
export async function mockCart(page: Page, products: any[] = [], initial: { id: number; quantity: number }[] = []) {
  const quantities = new Map(initial.map(x => [x.id, x.quantity]));
  await page.route('**/api/ecommerce/cart{,/**}', async route => {
    const request = route.request(), method = request.method();
    const path = new URL(request.url()).pathname.replace('/api/ecommerce/cart', '');
    if (method !== 'GET' && request.headers()['x-storefront-csrf'] !== 'cart-csrf') {
      await route.fulfill({ status: 400, json: { message: 'Missing CSRF' } }); return;
    }
    if (method === 'POST' && path === '/items' || method === 'PUT') {
      const body = request.postDataJSON(), id = method === 'POST' ? body.productId : Number(path.split('/').pop());
      const product = products.find(p => p.id === id);
      const quantity = method === 'POST' ? (quantities.get(id) || 0) + body.quantity : body.quantity;
      if (!product) { await route.fulfill({ status: 404, json: { message: 'Product unavailable' } }); return; }
      if (quantity < 1 || !Number.isInteger(quantity) || quantity > product.stockCount) {
        await route.fulfill({ status: 409, json: { message: 'Requested quantity exceeds available stock.' } }); return;
      }
      quantities.set(id, quantity);
    } else if (method === 'DELETE') {
      if (!path) quantities.clear(); else quantities.delete(Number(path.split('/').pop()));
    }
    const items = [...quantities].map(([id, quantity]) => ({ product: products.find(p => p.id === id), quantity })).filter(x => x.product);
    const pricedItems = items.map(x => ({...x, lineTotal: x.product.currentPrice == null ? null : x.product.currentPrice * x.quantity}));
    const subtotal = pricedItems.some(x => x.lineTotal == null) ? null : pricedItems.reduce((sum,x) => sum + (x.lineTotal ?? 0),0);
    await route.fulfill({ json: { items: pricedItems, subtotal, totalQuantity: items.reduce((sum, x) => sum + x.quantity, 0), stockAdjusted: false, csrfToken: 'cart-csrf' } });
  });
}
