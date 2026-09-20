import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-header-navigation',
 standalone: false,
 templateUrl: './header-navigation.component.html',
 styleUrl: './header-navigation.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class HeaderNavigationComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
