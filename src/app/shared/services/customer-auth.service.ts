import { CartService } from './cart.service';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface StorefrontCustomer { id: number; firstName: string; lastName: string; email: string; phone: string | null; }
export interface GoogleChallenge { clientId: string; nonce: string; csrfToken: string; }
export interface GoogleLoginResult {
  requiresRegistration: boolean; firstName?: string; lastName?: string; email?: string; customer?: StorefrontCustomer;
}

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly cart = inject(CartService);
  private readonly base = '/api/ecommerce/auth';
  private csrf = '';
  private checkedSession = false;
  readonly customer = signal<StorefrontCustomer | null>(null);

  async restoreSession(): Promise<void> {
    if (this.checkedSession) return;
    this.checkedSession = true;
    try { this.customer.set(await firstValueFrom(this.http.get<StorefrontCustomer>(this.base + '/me'))); }
    catch { this.customer.set(null); }
  }
  async challenge(): Promise<GoogleChallenge> {
    const challenge = await firstValueFrom(this.http.get<GoogleChallenge>(this.base + '/challenge'));
    this.csrf = challenge.csrfToken;
    return challenge;
  }
  private async post(path: string, body: unknown): Promise<GoogleLoginResult> {
    const result = await firstValueFrom(this.http.post<GoogleLoginResult>(this.base + path, body,
      { headers: { 'X-Storefront-CSRF': this.csrf } }));
    if (result.customer) { this.customer.set(result.customer); await this.cart.afterLogin(); }
    return result;
  }
  google(credential: string) { return this.post('/google', { credential }); }
  register(details: { firstName: string; lastName: string; phone: string }) { return this.post('/register', details); }
  async logout(): Promise<void> {
    await this.challenge();
    await firstValueFrom(this.http.post(this.base + '/logout', {}, { headers: { 'X-Storefront-CSRF': this.csrf } }));
    this.customer.set(null);
    await this.cart.refresh(true);
  }
  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error?.message) return error.error.message;
      if (error.status === 400) return 'Please check your details or start Google sign-in again.';
      if (error.status === 0 || error.status >= 500) return 'Sign-in is unavailable. Please try again.';
    }
    return 'Unable to sign in. Please try again.';
  }
}
