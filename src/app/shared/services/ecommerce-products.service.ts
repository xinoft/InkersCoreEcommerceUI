import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { ECOMMERCE_API_URL } from './ecommerce-categories.service';
import { StorefrontProduct, StorefrontProductList } from '../models/storefront-product';

@Injectable({ providedIn: 'root' })
export class EcommerceProductsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ECOMMERCE_API_URL);
  get(productId: number) { return this.http.get<StorefrontProduct>(this.api + '/products/' + productId).pipe(timeout(15000)); }
  list(categoryId: number | null) {
    const params = categoryId === null ? new HttpParams() : new HttpParams().set('categoryId', categoryId);
    return this.http.get<StorefrontProductList>(this.api + '/products', { params }).pipe(timeout(15000));
  }
}
