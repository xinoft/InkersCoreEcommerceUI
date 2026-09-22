import { Component, input } from '@angular/core';
import { StorefrontProduct } from '../models/storefront-product';
@Component({
 selector: 'app-product-price', standalone: false,
 templateUrl: './product-price.component.html',
 styles: [':host{display:inline-flex;align-items:baseline;gap:8px;flex-wrap:wrap}'],
})
export class ProductPriceComponent {
 readonly product = input<StorefrontProduct | null>(null);
}
