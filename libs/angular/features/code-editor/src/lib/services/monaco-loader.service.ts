import { Injectable } from '@angular/core';
import type * as Monaco from 'monaco-editor';

@Injectable({ providedIn: 'root' })
export class MonacoLoaderService {
  private _monaco: typeof Monaco | null = null;
  private _loading: Promise<typeof Monaco> | null = null;

  async loadMonaco(): Promise<typeof Monaco> {
    if (this._monaco) return this._monaco;
    if (this._loading) return this._loading;

    this._loading = this.load();
    return this._loading;
  }

  private load(): Promise<typeof Monaco> {
    return new Promise((resolve, reject) => {
      const baseUrl = 'monaco-editor/min/vs';

      const script = document.createElement('script');
      script.src = `${baseUrl}/loader.js`;
      script.onload = () => {
        const require = (window as any).require;

        require.config({ paths: { vs: baseUrl } });
        require(['vs/editor/editor.main'], () => {
          this._monaco = (window as any).monaco;
          resolve(this._monaco!);
        });
      };
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }
}
