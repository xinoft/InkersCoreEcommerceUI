import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart-items', standalone: false, changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-items.component.html', styleUrl: './cart-items.component.css',
})
export class CartItemsComponent {
  readonly layout = input<'side' | 'page'>('side');
  readonly cart = inject(CartService);
  remove(event: Event, id: number): void { event.preventDefault(); event.stopImmediatePropagation(); this.cart.remove(id); }
  edit(event: Event): void {
    event.preventDefault(); event.stopImmediatePropagation();
    (event.currentTarget as HTMLElement).closest(".minicart-item")?.querySelector<HTMLInputElement>(".items-qty-input")?.focus();
  }
  imageFailed(event: Event): void {
    const image = event.target as HTMLImageElement;
    const fallback = 'assets/images/product-img/electronics/electronics-bg-trans-10-a-1.webp';
    if (image.getAttribute('src') !== fallback) image.src = fallback;
  }
}
