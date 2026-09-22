import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CartLine, CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart-quantity', standalone: false, changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-quantity.component.html', styles: [':host { display: contents; }'],
})
export class CartQuantityComponent {
  readonly line = input.required<CartLine>();
  readonly cart = inject(CartService);
  change(event: Event, quantity: number): void {
    // Prevent the original template's jQuery handler from applying a second increment.
    event.preventDefault(); event.stopImmediatePropagation();
    this.cart.setQuantity(this.line().product.id, quantity);
  }
  typed(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.change(event, input.valueAsNumber);
    input.value = String(this.line().quantity);
  }
}
