import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-product-details',
 standalone: false,
 templateUrl: './product-details.component.html',
 styleUrl: './product-details.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class ProductDetailsComponent extends TemplatePage {
 protected override readonly pageTitle = 'Product Details';
}
