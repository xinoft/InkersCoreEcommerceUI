import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { StorefrontProduct } from '../models/storefront-product';
import { TemplateRuntimeService } from '../services/template-runtime.service';

@Component({
  selector: 'app-product-card', standalone: false,
  templateUrl: './product-card.component.html', styleUrl: './product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly item = input.required<StorefrontProduct>();
  readonly compared = signal(false);
  private readonly failedImages = signal<ReadonlySet<string>>(new Set());
  private readonly images = computed(() => this.item().files.filter(file => file.contentType.startsWith('image/') && !this.failedImages().has(file.url)));
  private readonly fallback = 'assets/images/product-img/electronics/electronics-bg-trans-10-a-1.webp';
  readonly image = computed(() => this.images()[0]?.url || this.fallback);
  readonly hoverImage = computed(() => this.images()[1]?.url || this.image());
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const runtime = inject(TemplateRuntimeService);
    const zone = inject(NgZone);
    const abort = new AbortController();
    let alive = true;
    let slider: any;
    const tooltips: any[] = [];
    inject(DestroyRef).onDestroy(() => {
      alive = false; abort.abort(); clearTimeout(this.toastTimer);
      if (slider && !slider.destroyed) slider.destroy(true, true);
      tooltips.forEach(tooltip => { if (tooltip._element) tooltip.dispose(); });
      document.querySelector('.rbt-toaster-compare')?.classList.remove('is-visible');
    });
    afterNextRender(async () => {
      await runtime.load();
      if (!alive) return;
      zone.runOutsideAngular(() => {
        // API cards can arrive after the template's initial page setup.
        const win = window as any;
        const element = host.querySelector('.rbt-text-swiper-container') as any;
        if (element) {
          slider = element.swiper || new win.Swiper(element, {
            loop: true, slidesPerView: 1, direction: 'vertical', effect: 'slide',
            autoplay: { delay: 2000, reverseDirection: true, disableOnInteraction: false },
            navigation: { prevEl: element.querySelector('.rbt-arrow-prev'), nextEl: element.querySelector('.rbt-arrow-next') },
          });
          element.addEventListener('mouseenter', () => slider.autoplay?.stop(), { signal: abort.signal });
          element.addEventListener('mouseleave', () => slider.autoplay?.start(), { signal: abort.signal });
        }
        host.querySelectorAll<HTMLElement>('[data-tooltip]').forEach(element => {
          if (!win.bootstrap.Tooltip.getInstance(element)) tooltips.push(new win.bootstrap.Tooltip(element, {
            title: element.dataset['tooltip'], placement: element.dataset['tooltipPosition'] || 'top', container: 'body',
          }));
        });
      });
    });
  }
  imageFailed(event: Event): void {
    const url = (event.target as HTMLImageElement).getAttribute('src');
    if (url && url !== this.fallback) this.failedImages.update(current => new Set([...current, url]));
  }
  compare(event: Event): void {
    event.preventDefault(); event.stopImmediatePropagation();
    this.compared.set(true);
    const toast = document.querySelector('.rbt-toaster-compare');
    toast?.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast?.classList.remove('is-visible'), 1500);
  }
}

