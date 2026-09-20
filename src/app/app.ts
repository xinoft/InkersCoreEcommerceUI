import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
 selector: 'app-root', standalone: false, templateUrl: './app.html', styleUrl: './app.css',
 host: { '(click)': 'navigate($event)' },
})
export class App {
  private readonly router = inject(Router);
  navigate(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const href = link.getAttribute('href')!;
    if (href.startsWith('#')) {
      event.preventDefault();
      if (href !== '#' && href !== '#!' && !link.hasAttribute('data-bs-toggle')) void this.router.navigateByUrl(this.router.url.split('#')[0] + href);
      return;
    }
    const url = new URL(href, document.baseURI);
    if (url.origin !== location.origin) return;
    const routes = ['/', '/index.html', '/home', '/home-fashion.html', '/products', '/shop.html', '/product-details', '/product-single-default.html', '/cart', '/cart.html', '/checkout', '/checkout-delivery-step-one.html'];
    if (routes.includes(url.pathname)) {
      event.preventDefault();
      void this.router.navigateByUrl((url.pathname === '/index.html' ? '/' : url.pathname) + url.search + url.hash);
    }
  }
}
