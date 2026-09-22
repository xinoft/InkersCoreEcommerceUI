import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryNavigationComponent } from './category-navigation.component';
import { EcommerceCategoriesService } from '../services/ecommerce-categories.service';

const categories = [{ id: 1, parentId: null, name: 'Fashion', uniqueKey: 'fashion', sortOrder: 0,
  children: [{ id: 2, parentId: 1, name: 'Shirts', uniqueKey: 'shirts', sortOrder: 0, children: [] }] }];

describe('Public category navigation', () => {
  beforeEach(() => TestBed.configureTestingModule({
    declarations: [CategoryNavigationComponent], imports: [CommonModule, RouterModule],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shares one anonymous request between navigation instances and renders nested links', () => {
    const first = TestBed.createComponent(CategoryNavigationComponent);
    const second = TestBed.createComponent(CategoryNavigationComponent);
    const request = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/categories');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(false);
    request.flush(categories); first.detectChanges(); second.detectChanges();
    const element: HTMLElement = first.nativeElement;
    expect(element.querySelector('a[href="/products?categoryId=2"]')?.textContent).toContain('Shirts');
    const toggle = element.querySelector<HTMLButtonElement>('.category-toggle')!;
    toggle.click(); first.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); first.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows a recoverable failure and retries successfully', () => {
    const fixture = TestBed.createComponent(CategoryNavigationComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/ecommerce/categories').flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Categories unavailable');
    element.querySelector<HTMLButtonElement>('.category-retry')!.click();
    http.expectOne('/api/ecommerce/categories').flush(categories); fixture.detectChanges();
    expect(element.textContent).toContain('Fashion');
    expect(element.querySelector('.category-retry')).toBeNull();
  });

  it('handles an empty catalog and keeps the all-products destination', () => {
    const fixture = TestBed.createComponent(CategoryNavigationComponent);
    TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/categories').flush([]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No categories available');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).not.toBeNull();
    TestBed.inject(EcommerceCategoriesService).load();
    TestBed.inject(HttpTestingController).expectNone('/api/ecommerce/categories');
  });
  it('times out an unresponsive API so navigation can be retried', () => {
    vi.useFakeTimers();
    try {
      const store = TestBed.inject(EcommerceCategoriesService);
      store.load();
      const request = TestBed.inject(HttpTestingController).expectOne('/api/ecommerce/categories');
      vi.advanceTimersByTime(15000);
      expect(store.status()).toBe('error');
      expect(request.cancelled).toBe(true);
    } finally { vi.useRealTimers(); }
  });

});
