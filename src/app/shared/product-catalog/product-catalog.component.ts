import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, combineLatest, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { EcommerceProductsService } from '../services/ecommerce-products.service';
import { StorefrontProductList } from '../models/storefront-product';

import { EcommerceCategoriesService } from '../services/ecommerce-categories.service';
import { StorefrontCategory } from '../models/storefront-category';

type CatalogState = { status: 'loading' | 'ready' | 'error'; result?: StorefrontProductList; message?: string };

@Component({
  selector: 'app-product-catalog', standalone: false,
  templateUrl: './product-catalog.component.html', styleUrl: './product-catalog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCatalogComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly products = inject(EcommerceProductsService);
  private readonly refresh = new Subject<void>();
  readonly categories = inject(EcommerceCategoriesService);
  private readonly router = inject(Router);
  readonly selectedCategory = toSignal(this.route.queryParamMap.pipe(map(params => params.has('categoryId') ? Number(params.get('categoryId')) : null)), { initialValue: null });
  readonly categoryOptions = computed(() => {
    const result: { id: number; name: string; depth: number }[] = [];
    const visit = (nodes: readonly StorefrontCategory[], depth: number) => {
      for (const node of nodes) { result.push({ id: node.id, name: node.name, depth }); visit(node.children, depth + 1); }
    };
    visit(this.categories.categories(), 0);
    return result;
  });
  constructor() { this.categories.load(); }
  chooseCategory(categoryId: number | null): void {
    void this.router.navigate(['/products'], { queryParams: { categoryId } });
  }
  resultSummary(): string {
    const result = this.state().result;
    if (!result) return this.state().status === 'loading' ? 'Loading products…' : 'Products unavailable';
    return 'Showing ' + (result.totalCount ? '1–' + result.totalCount : '0') + ' of ' + result.totalCount + ' results' +
      (result.categoryName ? ' · ' + result.categoryName + ' (including subcategories)' : '');
  }
  readonly state = toSignal(combineLatest([
    this.route.queryParamMap.pipe(map(params => params.get('categoryId')), distinctUntilChanged()),
    this.refresh.pipe(startWith(undefined)),
  ]).pipe(switchMap(([value]) => {
    const id = value === null ? null : Number(value);
    if (value !== null && (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id! <= 0)) {
      return of<CatalogState>({ status: 'error', message: 'This category link is invalid. Please choose a category.' });
    }
    // Cancel stale requests when shoppers choose another category on the same route.
    return this.products.list(id).pipe(
      map(result => ({ status: 'ready', result }) as CatalogState),
      catchError((error: HttpErrorResponse) => of<CatalogState>({ status: 'error', message:
        error.status === 404 ? 'This category is no longer available. Please choose another category.' : 'Products could not be loaded. Please try again.' })),
      startWith<CatalogState>({ status: 'loading' }),
    );
  })), { initialValue: { status: 'loading' } as CatalogState });

  retry(): void { this.refresh.next(); }
}
