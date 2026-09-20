import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-template-overlays',
 standalone: false,
 templateUrl: './template-overlays.component.html',
 styleUrl: './template-overlays.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class TemplateOverlaysComponent {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
