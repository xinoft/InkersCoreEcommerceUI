import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-checkout',
 standalone: false,
 templateUrl: './checkout.component.html',
 styleUrl: './checkout.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class CheckoutComponent extends TemplatePage {
 protected override readonly pageTitle = 'Checkout Delivery Details';
}
