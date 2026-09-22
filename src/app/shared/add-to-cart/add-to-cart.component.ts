import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { StorefrontProduct } from '../models/storefront-product';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-add-to-cart', standalone: false, changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-to-cart.component.html', styleUrl: './add-to-cart.component.css',
})
export class AddToCartComponent {
  readonly product = input.required<StorefrontProduct>();
  readonly cart = inject(CartService);
  readonly feedback = signal('');
  async add(event: Event): Promise<void> {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!await this.cart.add(this.product())) { event.stopImmediatePropagation(); this.feedback.set(this.cart.message()); return; }
    this.feedback.set('');
    document.querySelector('.rbt-cart-side-menu')?.classList.add('side-menu-active');
    document.body.classList.add('cart-sidenav-menu-active');
  }
}
