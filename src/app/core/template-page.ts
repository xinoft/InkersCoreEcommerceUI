import { Directive, DestroyRef, afterNextRender, inject, ElementRef, ErrorHandler } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TemplateRuntimeService } from '../shared/services/template-runtime.service';

@Directive()
export abstract class TemplatePage {
  protected abstract readonly pageTitle: string;
  private readonly runtime = inject(TemplateRuntimeService);
  private readonly title = inject(Title);
  private readonly errors = inject(ErrorHandler);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  constructor() {
    let active = true;
    inject(DestroyRef).onDestroy(() => { active = false; this.runtime.unmount(); document.body.className = ''; });
    afterNextRender(async () => {
      document.body.className = 'rbt-header-sticky';
      this.title.setTitle(this.pageTitle + ' | InkersCore');
      try { await this.runtime.load(); if (active) this.runtime.mount(this.host); }
      catch (error) { if (active) this.errors.handleError(error); }
    });
  }
}
