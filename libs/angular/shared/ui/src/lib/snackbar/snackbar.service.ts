import { Injectable, signal } from '@angular/core';

export enum SnackbarType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

export interface SnackbarState {
  message: string;
  type: SnackbarType;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  readonly state = signal<SnackbarState>({ message: '', type: SnackbarType.Info, visible: false });

  private timer: ReturnType<typeof setTimeout> | null = null;

  success(message = 'Success!'): void {
    this.show(message, SnackbarType.Success);
  }

  error(message = 'Failure!'): void {
    this.show(message, SnackbarType.Error);
  }

  info(message = 'Info', duration?: number): void {
    this.show(message, SnackbarType.Info, duration);
  }

  dismiss(): void {
    this.state.set({ message: '', type: SnackbarType.Info, visible: false });
  }

  private show(message: string, type: SnackbarType, duration = 3000): void {
    if (this.timer) clearTimeout(this.timer);

    this.state.set({ message, type, visible: true });
    this.timer = setTimeout(() => this.dismiss(), duration);
  }
}
