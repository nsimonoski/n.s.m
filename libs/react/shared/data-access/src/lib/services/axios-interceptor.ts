import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { useSnackbarStore } from '../stores/snackbar.store';

let initialized = false;

export function setupAxiosInterceptor(): void {
  if (initialized) return;
  initialized = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
        useSnackbarStore.getState().error('Session expired. Logging out...');
        await useAuthStore.getState().logout();
        window.location.href = '/react/login';
      }
      if (error.response?.status === 403) {
        useSnackbarStore.getState().error(error.response?.data?.message ?? 'Insufficient permissions');
      }
      return Promise.reject(error);
    },
  );
}
