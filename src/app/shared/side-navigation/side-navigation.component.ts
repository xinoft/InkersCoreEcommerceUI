import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-side-navigation',
 standalone: false,
 templateUrl: './side-navigation.component.html',
 styleUrl: './side-navigation.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class SideNavigationComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
