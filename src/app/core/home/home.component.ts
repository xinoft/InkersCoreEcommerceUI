import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-home',
 standalone: false,
 templateUrl: './home.component.html',
 styleUrl: './home.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class HomeComponent extends TemplatePage {
 protected override readonly pageTitle = 'Home Fashion';
}
