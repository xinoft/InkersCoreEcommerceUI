import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { StorefrontProduct } from '../models/storefront-product';
const product: StorefrontProduct = { id: 1, name: 'Shirt', code: 'SHIRT', slug: 'shirt', stockCount: 3,
  shortDescription: null, fullDescription: null, createdTime: '', lastUpdatedTime: '', categories: [], files: [] };
const response = (quantity = 0) => ({ items: quantity ? [{ product, quantity }] : [], totalQuantity: quantity, csrfToken: 'csrf-test', stockAdjusted: false });
describe('Server cart state', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  async function cart(quantity = 0) {
    const service = TestBed.inject(CartService);
    TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart').flush(response(quantity));
    await Promise.resolve(); return service;
  }
  it('loads the server cart and sends product IDs with CSRF on add', async () => {
    const service = await cart(1);
    const pending = service.add(product);
    const request = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ productId: 1, quantity: 1 });
    expect(request.request.headers.get('X-Storefront-CSRF')).toBe('csrf-test');
    request.flush(response(2)); expect(await pending).toBe(true); expect(service.count()).toBe(2);
  });
  it('preserves state when the server rejects stock and permits retry', async () => {
    const service = await cart(2);
    const pending = service.setQuantity(1, 4);
    TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart/items/1').flush({ message: 'Requested quantity exceeds available stock.' }, { status: 409, statusText: 'Conflict' });
    await pending; expect(service.count()).toBe(2); expect(service.message()).toContain('stock');
    expect(service.loading()).toBe(false);
  });
  it('rejects invalid quantities without making a write request', async () => {
    const service = await cart(1);
    for (const value of [0, -1, 1.5, NaN, Infinity]) await service.setQuantity(1, value);
    expect(service.count()).toBe(1);
    TestBed.inject(HttpTestingController).expectNone('/api/ecommerce/cart/items/1');
  });
  it('removes and clears using server responses', async () => {
    const service = await cart(1);
    const remove = service.remove(1);
    const request = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart/items/1');
    expect(request.request.method).toBe('DELETE'); request.flush(response()); await remove;
    expect(service.count()).toBe(0);
    const clear = service.clear(); TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart').flush(response()); await clear;
  });
  it('drops the old account state before refresh and ignores a stale response', async () => {
    const service = await cart(2);
    const old = service.refresh();
    const oldRequest = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart');
    const reset = service.refresh(true);
    const resetRequest = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/cart');
    expect(service.count()).toBe(0);
    resetRequest.flush(response()); await reset;
    oldRequest.flush(response(2)); await old;
    expect(service.count()).toBe(0);
  });
});
