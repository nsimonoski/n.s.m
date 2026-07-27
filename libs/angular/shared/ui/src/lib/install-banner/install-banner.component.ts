import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'ui-install-banner',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="install-banner">
        <span class="install-text">{{ message() }}</span>
        <div class="install-actions">
          @if (showInstallButton()) {
            <button class="install-btn" (click)="install()">Install</button>
          }
          <button class="dismiss-btn" (click)="dismiss()">✕</button>
        </div>
      </div>
    }
  `,
  styles: `
    .install-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
      background: var(--bg-secondary, #2d2d3d);
      border-top: 1px solid var(--accent-primary, #7c3aed);
      color: var(--text-primary, #e0e0e0);
      font-size: 14px;
    }

    .install-text {
      flex: 1;
      margin-right: 12px;
    }

    .install-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .install-btn {
      background: var(--accent-primary, #7c3aed);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 14px;
      cursor: pointer;
    }

    .dismiss-btn {
      background: none;
      border: none;
      color: var(--text-primary, #e0e0e0);
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      opacity: 0.7;
    }

    .dismiss-btn:hover {
      opacity: 1;
    }
  `,
})
export class InstallBannerComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);
  readonly message = signal('');
  readonly showInstallButton = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly STORAGE_KEY = 'kod3_install_dismissed';

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    if (this.isStandalone()) return;
    if (localStorage.getItem(this.STORAGE_KEY)) return;

    if (this.isIos()) {
      this.message.set('Install kod3: tap Share then "Add to Home Screen"');
      this.visible.set(true);
    } else {
      const handler = (e: Event): void => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.message.set('Install kod3 for a better experience');
        this.showInstallButton.set(true);
        this.visible.set(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('beforeinstallprompt', handler);
      });
    }
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.visible.set(false);
    }
    this.deferredPrompt = null;
  }

  dismiss(): void {
    localStorage.setItem(this.STORAGE_KEY, '1');
    this.visible.set(false);
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
