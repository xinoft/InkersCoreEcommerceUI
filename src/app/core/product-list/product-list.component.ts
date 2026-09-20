import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-product-list',
 standalone: false,
 templateUrl: './product-list.component.html',
 styleUrl: './product-list.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class ProductListComponent extends TemplatePage {
 protected override readonly pageTitle = 'Shop';
}
