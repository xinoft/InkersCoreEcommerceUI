import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

describe('Storefront navigation', () => {
  function setup() {
    TestBed.configureTestingModule({ declarations: [App], providers: [provideRouter([])] });
    const app = TestBed.runInInjectionContext(() => new App());
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { app, navigate };
  }
  function click(href: string, options: MouseEventInit = {}, attributes: Record<string,string> = {}) {
    const link = document.createElement('a'); link.href = href;
    Object.entries(attributes).forEach(([key,value]) => link.setAttribute(key,value));
    const event = new MouseEvent('click', { cancelable: true, button: 0, ...options });
    Object.defineProperty(event, 'target', { value: link });
    return event;
  }
  it('routes migrated template URLs through Angular and preserves query parameters', () => {
    const {app,navigate} = setup();
    const event = click('shop.html?category=shirts'); app.navigate(event);
    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/shop.html?category=shirts');
  });
  it('keeps placeholder actions and Bootstrap tabs on the active page', () => {
    const {app,navigate} = setup();
    for (const event of [click('#!'), click('#'), click('#sizes', {}, {'data-bs-toggle':'pill'})]) {
      app.navigate(event); expect(event.defaultPrevented).toBe(true);
    }
    expect(navigate).not.toHaveBeenCalled();
  });
  it('preserves modified clicks, external links and unconverted template destinations', () => {
    const {app,navigate} = setup();
    for (const event of [click('cart.html',{ctrlKey:true}),click('https://example.com'),click('wishlist.html')]) {
      app.navigate(event); expect(event.defaultPrevented).toBe(false);
    }
    expect(navigate).not.toHaveBeenCalled();
  });
});
