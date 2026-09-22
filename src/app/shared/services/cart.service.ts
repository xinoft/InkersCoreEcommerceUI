import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { StorefrontProduct } from '../models/storefront-product';

export interface CartLine { product: StorefrontProduct; quantity: number; lineTotal?: number | null; }
interface CartResponse { subtotal?: number | null; items: CartLine[]; totalQuantity: number; stockAdjusted: boolean; csrfToken: string; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/ecommerce/cart';
  private readonly state = signal<readonly CartLine[]>([]);
  private csrf = '';
  private sequence = 0;
  readonly items = this.state.asReadonly();
  readonly subtotal = signal<number | null>(null);
  readonly count = computed(() => this.items().reduce((sum, line) => sum + line.quantity, 0));
  readonly message = signal('');
  readonly loading = signal(false);

  constructor() { void this.refresh(); }

  private accept(response: CartResponse): void {
    this.subtotal.set(response.subtotal ?? null); this.state.set(response.items); this.csrf = response.csrfToken;
    this.message.set(response.stockAdjusted ? 'Your cart was updated to match available stock.' : '');
  }
  private error(error: unknown): void {
    const response = error as HttpErrorResponse;
    this.message.set(response.error?.message || 'Could not update your cart. Please refresh and try again.');
  }
  async refresh(reset = false): Promise<void> {
    const sequence = ++this.sequence;
    if (reset) { this.state.set([]); this.subtotal.set(null); this.csrf = ''; }
    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.http.get<CartResponse>(this.base).pipe(timeout(15000)));
      if (sequence === this.sequence) this.accept(response);
    } catch (error) { if (sequence === this.sequence) this.error(error); }
    finally { if (sequence === this.sequence) this.loading.set(false); }
  }
  private async mutate(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<boolean> {
    if (this.loading()) return false;
    if (!this.csrf) {
      await this.refresh();
      if (!this.csrf) return false;
    }
    const sequence = ++this.sequence; this.loading.set(true); this.message.set('');
    try {
      const response = await firstValueFrom(this.http.request<CartResponse>(method, this.base + path,
        { body, headers: { 'X-Storefront-CSRF': this.csrf } }).pipe(timeout(15000)));
      if (sequence !== this.sequence) return false;
      this.accept(response); return true;
    } catch (error) { if (sequence === this.sequence) this.error(error); return false; }
    finally { if (sequence === this.sequence) this.loading.set(false); }
  }
  async add(product: StorefrontProduct): Promise<boolean> {
    if (product.stockCount < 1) { this.message.set('This product is out of stock.'); return false; }
    return this.mutate('POST', '/items', { productId: product.id, quantity: 1 });
  }
  async setQuantity(id: number, value: number): Promise<void> {
    if (!Number.isSafeInteger(value) || value < 1 || value > 999999) {
      this.message.set('Enter a whole quantity between 1 and 999999.'); return;
    }
    await this.mutate('PUT', '/items/' + id, { quantity: value });
  }
  async remove(id: number): Promise<void> { await this.mutate('DELETE', '/items/' + id); }
  async clear(): Promise<void> { await this.mutate('DELETE', ''); }
  async afterLogin(): Promise<void> {
    await this.refresh(true);
    await this.mutate('POST', '/merge', {});
  }
  image(product: StorefrontProduct): string {
    return product.files.find(file => file.contentType.startsWith('image/'))?.url
      ?? 'assets/images/product-img/electronics/electronics-bg-trans-10-a-1.webp';
  }
}
