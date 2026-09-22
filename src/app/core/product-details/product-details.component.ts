import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { EcommerceProductsService } from '../../shared/services/ecommerce-products.service';
import { StorefrontProduct } from '../../shared/models/storefront-product';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-product-details',
 standalone: false,
 templateUrl: './product-details.component.html',
 styleUrl: './product-details.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class ProductDetailsComponent extends TemplatePage {
 private readonly products = inject(EcommerceProductsService);
 readonly state = toSignal(inject(ActivatedRoute).queryParamMap.pipe(
  map(params => params.get('productId')), distinctUntilChanged(),
  switchMap(value => {
   const id = Number(value);
   if (!value || !Number.isSafeInteger(id) || id <= 0) return of({product: null as StorefrontProduct | null, message: 'Select a product from the product listing to view its pricing.'});
   return this.products.get(id).pipe(
    map(product => ({product: product as StorefrontProduct | null, message: ''})),
    catchError(() => of({product: null as StorefrontProduct | null, message: 'Unable to load this product. Please refresh and try again.'})),
    startWith({product: null as StorefrontProduct | null, message: 'Loading product…'})
   );
  })
 ), {initialValue: {product: null as StorefrontProduct | null, message: 'Loading product…'}});
 protected override readonly pageTitle = 'Product Details';
}
