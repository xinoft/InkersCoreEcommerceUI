import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-footer',
 standalone: false,
 templateUrl: './footer.component.html',
 styleUrl: './footer.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class FooterComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
