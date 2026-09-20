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
 protected override readonly pageTitle = 'Cart';
}
