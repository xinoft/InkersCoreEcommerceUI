import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-customer-reviews',
 standalone: false,
 templateUrl: './customer-reviews.component.html',
 styleUrl: './customer-reviews.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class CustomerReviewsComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
