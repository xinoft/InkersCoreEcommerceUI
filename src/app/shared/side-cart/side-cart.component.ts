import { inject } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-side-cart',
 standalone: false,
 templateUrl: './side-cart.component.html',
 styleUrl: './side-cart.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class SideCartComponent {
 readonly cart = inject(CartService);
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
