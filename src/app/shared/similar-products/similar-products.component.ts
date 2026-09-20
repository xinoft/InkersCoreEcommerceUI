import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-similar-products',
 standalone: false,
 templateUrl: './similar-products.component.html',
 styleUrl: './similar-products.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class SimilarProductsComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
