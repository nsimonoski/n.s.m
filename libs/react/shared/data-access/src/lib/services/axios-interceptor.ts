import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

let initialized = false;

export function setupAxiosInterceptor(): void {
  if (initialized) return;
  initialized = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
        await useAuthStore.getState().logout();
        window.location.href = '/react/login';
      }
      return Promise.reject(error);
    },
  );
}
