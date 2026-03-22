import { create } from 'zustand';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarState {
  message: string;
  type: SnackbarType;
  visible: boolean;
}

interface SnackbarActions {
  success: (message?: string) => void;
  error: (message?: string) => void;
  info: (message?: string) => void;
  dismiss: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useSnackbarStore = create<SnackbarState & SnackbarActions>((set) => ({
  message: '',
  type: 'info',
  visible: false,

  success(message = 'Success!') {
    show(set, message, 'success');
  },

  error(message = 'Failure!') {
    show(set, message, 'error');
  },

  info(message = 'Info') {
    show(set, message, 'info');
  },

  dismiss() {
    set({ message: '', type: 'info', visible: false });
  },
}));

function show(set: (state: Partial<SnackbarState>) => void, message: string, type: SnackbarType, duration = 3000): void {
  if (timer) clearTimeout(timer);

  set({ message, type, visible: true });
  timer = setTimeout(() => useSnackbarStore.getState().dismiss(), duration);
}
