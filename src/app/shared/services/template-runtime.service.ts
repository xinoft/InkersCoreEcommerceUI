import { Injectable, NgZone, inject } from '@angular/core';

/** Keeps the supplied template libraries behind a route-scoped lifecycle boundary. */
@Injectable({ providedIn: 'root' })
export class TemplateRuntimeService {
  private readonly zone = inject(NgZone);
  private loading?: Promise<void>;
  private cleanup?: () => void;
  private readonly scripts = [
    'vendor/modernizr.min.js', 'vendor/jquery.js', 'vendor/bootstrap.min.js', 'vendor/swiper.js',
    'vendor/fancybox.min.js', 'vendor/odometer.js', 'vendor/jquery-ui.js', 'vendor/elevatezoom.min.js',
    'vendor/bootstrap-select.min.js', 'vendor/progressbar.min.js', 'vendor/isotope.pkgd.min.js',
    'vendor/imageloaded.js', 'vendor/jquery.waypoints.min.js', 'vendor/bootstrap-datepicker.min.js',
    'angular/template-behaviors.js',
  ];
  load(): Promise<void> {
    return this.loading ??= this.scripts.reduce((chain, file) => chain.then(() => new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/' + file;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load template behavior: ' + file));
      document.body.appendChild(script);
    })), Promise.resolve());
  }
  mount(root: HTMLElement): void {
    this.unmount();
    this.zone.runOutsideAngular(() => {
      const win = window as any, jq = win.jQuery;
      let alive = true;
      const timeouts = new Set<number>(), intervals = new Set<number>(), frames = new Set<number>();
      const observers: IntersectionObserver[] = [], listeners: Array<() => void> = [];
      const namespace = '.inkersStorefront', patched = new WeakSet<object>();
      const patch = (collection: any): any => {
        if (!collection || patched.has(collection)) return collection;
        patched.add(collection);
        for (const method of ['on', 'one']) {
          collection[method] = function (types: any, ...args: any[]) {
            const qualify = (value: string) => value.split(/\s+/).map(name => name + namespace).join(' ');
            const qualified = typeof types === 'string' ? qualify(types) :
              Object.fromEntries(Object.entries(types).map(([name, handler]) => [qualify(name), handler]));
            return jq.fn[method].call(this, qualified, ...args);
          };
        }
        collection.ready = function (callback: (jquery: any) => void) { if (alive) callback.call(document, $); return this; };
        for (const method of ['find','children','closest','parent','parents','siblings','filter','not','eq','first','last','add','next','prev']) {
          collection[method] = function (...args: any[]) { return patch(jq.fn[method].apply(this, args)); };
        }
        return collection;
      };
      const $: any = (selector: any, context?: any) => {
        if (typeof selector === 'function') { if (alive) selector.call(document, $); return patch(jq(document)); }
        return patch(jq(selector, context));
      };
      Object.setPrototypeOf($, jq); $.fn = jq.fn;
      const listen = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
        target.addEventListener(type, handler, options);
        listeners.push(() => target.removeEventListener(type, handler, options));
      };
      const scope = {
        $,
        setTimeout: (callback: (...args: any[]) => void, delay = 0, ...args: any[]) => {
          const id = window.setTimeout(() => { timeouts.delete(id); if (alive) callback(...args); }, delay);
          timeouts.add(id); return id;
        },
        setInterval: (callback: (...args: any[]) => void, delay: number, ...args: any[]) => {
          const id = window.setInterval(() => { if (alive) callback(...args); }, delay);
          intervals.add(id); return id;
        },
        clearTimeout: (id: number) => { window.clearTimeout(id); timeouts.delete(id); },
        clearInterval: (id: number) => { window.clearInterval(id); intervals.delete(id); },
        requestAnimationFrame: (callback: FrameRequestCallback) => {
          const id = window.requestAnimationFrame(time => { frames.delete(id); if (alive) callback(time); });
          frames.add(id); return id;
        },
        IntersectionObserver: class extends IntersectionObserver {
          constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
            super(callback, options); observers.push(this);
          }
        },
        windowListener: (type: string, handler: EventListener, options?: AddEventListenerOptions) => listen(window, type, handler, options),
        documentListener: (type: string, handler: EventListener, options?: AddEventListenerOptions) => listen(document, type, handler, options),
      };
      this.cleanup = () => {
        alive = false;
        timeouts.forEach(id => window.clearTimeout(id)); intervals.forEach(id => window.clearInterval(id));
        frames.forEach(id => window.cancelAnimationFrame(id));
        observers.forEach(observer => observer.disconnect()); listeners.forEach(remove => remove());
        jq(window).off(namespace); jq(document).off(namespace); jq(document.body).off(namespace); jq(document.documentElement).off(namespace);
        root.querySelectorAll<HTMLElement>('.swiper-initialized').forEach(element => (element as any).swiper?.destroy(true, true));
        root.querySelectorAll<HTMLElement>('.tooltips, [data-bs-toggle], .modal, .toast, .collapse').forEach(element => {
          for (const type of ['Tooltip','Popover','Modal','Toast','Collapse','Tab','Dropdown']) win.bootstrap?.[type]?.getInstance(element)?.dispose();
        });
        jq(root).find('.rbt-select-activation').each(function (this: HTMLElement) { if (jq(this).data('selectpicker')) jq(this).selectpicker('destroy'); });
        jq(root).find('.rbt-date-picker-activation, .rbt-expiry-date').each(function (this: HTMLElement) { if (jq(this).data('datepicker')) jq(this).datepicker('destroy'); });
        root.querySelectorAll('video').forEach(video => video.pause());
        win.Fancybox?.close(); win.Fancybox?.unbind(); win.Waypoint?.destroyAll();
        document.querySelectorAll('.modal-backdrop, .tooltip, .popover, .zoomContainer').forEach(element => element.remove());
        document.body.style.removeProperty('overflow'); document.body.style.removeProperty('padding-right');
        document.documentElement.classList.remove('menu-nav-opened', 'header-top-menu-nav-opened');
        root.removeAttribute('data-storefront-ready');
      };
      win.InkersTemplateMount(scope);
      root.querySelectorAll<HTMLElement>('.odometer').forEach(element => {
        if (!(element as any).odometer && win.Odometer) new win.Odometer({ el: element, value: element.textContent });
      });
      root.setAttribute('data-storefront-ready', 'true');
    });
  }
  unmount(): void { this.cleanup?.(); this.cleanup = undefined; }
}
