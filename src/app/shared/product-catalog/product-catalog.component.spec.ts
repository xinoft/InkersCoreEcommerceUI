import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, RouterModule, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ProductCatalogComponent } from './product-catalog.component';

describe('Product category listing', () => {
  const params = new BehaviorSubject(convertToParamMap({}));
  beforeEach(() => {
    params.next(convertToParamMap({}));
    TestBed.configureTestingModule({ declarations: [ProductCatalogComponent], imports: [CommonModule, RouterModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: params } }] });
  });
  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    http.match('/api/ecommerce/categories').forEach(request => request.flush([]));
    http.verify();
  });

  it('cancels the old request when the selected category changes', () => {
    const component = TestBed.createComponent(ProductCatalogComponent).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const previous = http.expectOne('/api/ecommerce/products');
    expect(previous.request.headers.has('Authorization')).toBe(false);
    params.next(convertToParamMap({ categoryId: '2' }));
    expect(previous.cancelled).toBe(true);
    http.expectOne('/api/ecommerce/products?categoryId=2').flush({ categoryId: 2, categoryName: 'Two', items: [], totalCount: 0 });
    expect(component.state().result?.categoryId).toBe(2);
    params.next(convertToParamMap({ categoryId: '2', unrelated: 'value' }));
    http.expectNone('/api/ecommerce/products?categoryId=2');
  });

  it('rejects invalid category links instead of requesting all products', () => {
    params.next(convertToParamMap({ categoryId: '-1' }));
    const component = TestBed.createComponent(ProductCatalogComponent).componentInstance;
    expect(component.state().status).toBe('error');
    TestBed.inject(HttpTestingController).expectNone(request => request.url.includes('/products'));
  });

  it('retries failed requests and renders an empty category without demo products', () => {
    params.next(convertToParamMap({ categoryId: '1' }));
    const fixture = TestBed.createComponent(ProductCatalogComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/ecommerce/products?categoryId=1').flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    expect(fixture.componentInstance.state().status).toBe('error');
    fixture.componentInstance.retry();
    http.expectOne('/api/ecommerce/products?categoryId=1').flush({ categoryId: 1, categoryName: 'Empty category', items: [], totalCount: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No products found in this category or its subcategories');
    expect(fixture.nativeElement.querySelectorAll('[data-product-id]').length).toBe(0);
  });
});
