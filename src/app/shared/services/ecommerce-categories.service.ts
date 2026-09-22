import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { StorefrontCategory } from '../models/storefront-category';

// Route /api/ecommerce to the API at the web server in production.
export const ECOMMERCE_API_URL = new InjectionToken<string>('ECOMMERCE_API_URL', {
  providedIn: 'root', factory: () => '/api/ecommerce',
});

@Injectable({ providedIn: 'root' })
export class EcommerceCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ECOMMERCE_API_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoryState = signal<readonly StorefrontCategory[]>([]);
  private readonly requestState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly categories = this.categoryState.asReadonly();
  readonly status = this.requestState.asReadonly();

  load(): void {
    // Desktop, sticky header and mobile navigation share a single anonymous request.
    if (this.status() === 'loading' || this.status() === 'ready') return;
    this.requestState.set('loading');
    this.http.get<StorefrontCategory[]>(this.apiUrl + '/categories')
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef)).subscribe({
        next: categories => { this.categoryState.set(categories); this.requestState.set('ready'); },
        error: () => { this.requestState.set('error'); },
      });
  }
}
