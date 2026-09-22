import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomerAuthService } from '../../shared/services/customer-auth.service';

interface GoogleIdentity {
  initialize(options: { client_id: string; nonce: string; auto_select: boolean; callback: (result: { credential: string }) => void }): void;
  renderButton(host: HTMLElement, options: { type: string; theme: string; size: string; text: string; width: number }): void;
}
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } }; } }

let googleScript: Promise<void> | undefined;
function loadGoogle(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  return googleScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); googleScript = undefined; reject(new Error('Google could not load.')); };
    document.head.append(script);
  });
}

@Component({
  selector: 'app-login', standalone: false, templateUrl: './login.component.html',
  styleUrl: './login.component.css', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly auth = inject(CustomerAuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly pending = signal(false);
  readonly email = signal('');
  readonly googleReady = signal(false);
  private loading = false;
  private initialized = false;
  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] }),
  });
  constructor() {
    afterNextRender(() => {
      void this.auth.restoreSession();
      const opened = (event: Event) => {
        if (this.host.nativeElement.contains(event.target as Node) && !this.initialized && !this.auth.customer()) void this.startGoogle();
      };
      document.addEventListener('shown.bs.modal', opened);
      this.destroy.onDestroy(() => document.removeEventListener('shown.bs.modal', opened));
    });
  }
  async startGoogle(): Promise<void> {
    if (this.loading || this.busy()) return;
    this.loading = true; this.error.set(''); this.pending.set(false); this.googleReady.set(false);
    try {
      const challenge = await this.auth.challenge();
      if (!challenge.clientId) { this.error.set('Google sign-in has not been configured yet.'); return; }
      await loadGoogle();
      if (this.destroy.destroyed) return;
      const google = window.google!.accounts.id;
      google.initialize({ client_id: challenge.clientId, nonce: challenge.nonce, auto_select: false,
        callback: result => { if (!this.destroy.destroyed) void this.signIn(result.credential); } });
      for (const element of this.host.nativeElement.querySelectorAll<HTMLElement>('.google-signin-host')) {
        element.replaceChildren();
        google.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width: 300 });
      }
      this.initialized = true; this.googleReady.set(true);
    } catch (error) { this.error.set(this.auth.errorMessage(error)); }
    finally { this.loading = false; }
  }
  async signIn(credential: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      const result = await this.auth.google(credential);
      if (result.requiresRegistration) {
        this.form.reset({ firstName: result.firstName ?? '', lastName: result.lastName ?? '', phone: '' });
        this.email.set(result.email ?? ''); this.pending.set(true);
      }
    } catch (error) { this.error.set(this.auth.errorMessage(error)); this.initialized = false; this.googleReady.set(false); }
    finally { this.busy.set(false); }
  }
  async completeSignup(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { await this.auth.register(this.form.getRawValue()); this.pending.set(false); }
    catch (error) { this.error.set(this.auth.errorMessage(error)); }
    finally { this.busy.set(false); }
  }
  async logout(): Promise<void> {
    this.busy.set(true); this.error.set('');
    try { await this.auth.logout(); this.initialized = false; }
    catch (error) { this.error.set(this.auth.errorMessage(error)); }
    finally { this.busy.set(false); }
    if (!this.auth.customer()) await this.startGoogle();
  }
}
