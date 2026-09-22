import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal } from '@angular/core';
import { EcommerceCategoriesService } from '../services/ecommerce-categories.service';

@Component({
  selector: 'app-category-navigation',
  standalone: false,
  templateUrl: './category-navigation.component.html',
  styleUrl: './category-navigation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryNavigationComponent {
  readonly mobile = input(false);
  readonly store = inject(EcommerceCategoriesService);
  private readonly element = inject(ElementRef<HTMLElement>);
  readonly expanded = signal<ReadonlySet<number>>(new Set());

  constructor() { this.store.load(); }

  setExpanded(id: number, open: boolean): void {
    this.expanded.update(current => {
      const next = new Set(current);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  }

  leaveBranch(event: FocusEvent, id: number): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      this.setExpanded(id, false);
    }
  }

  escape(event: Event, id: number, toggle: HTMLButtonElement): void {
    event.stopPropagation();
    this.setExpanded(id, false);
    toggle.focus();
  }

  select(): void {
    this.expanded.set(new Set());
    this.element.nativeElement.closest('.popup-mobile-menu')?.classList.remove('active');
  }
}
