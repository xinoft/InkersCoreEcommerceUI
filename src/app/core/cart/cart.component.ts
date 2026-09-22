import { inject } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-cart',
 standalone: false,
 templateUrl: './cart.component.html',
 styleUrl: './cart.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class CartComponent extends TemplatePage {
 readonly cart = inject(CartService);
 protected override readonly pageTitle = 'Cart';
}
