import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-template-utilities',
 standalone: false,
 templateUrl: './template-utilities.component.html',
 styleUrl: './template-utilities.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class TemplateUtilitiesComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
