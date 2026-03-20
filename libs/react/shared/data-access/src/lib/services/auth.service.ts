import axios from 'axios';
import type { UserProfileDto } from '@org/shared/contracts';
import { apiResult, Environment } from '@org/shared/utils';

const API = `${Environment.API_BASE_URL}/auth`;

export const authService = {
  getLoginInfo: () =>
    apiResult(axios.get<UserProfileDto | null>(`${API}/login-info`).then((r) => r.data)),

  guestLogin: () =>
    apiResult(axios.get<UserProfileDto>(`${API}/guest`).then((r) => r.data)),

  logout: () =>
    apiResult(axios.post<void>(`${API}/logout`, {}).then((r) => r.data)),

  getGithubAuthUrl: () => `${Environment.API_BASE_URL}/auth/github?app=react`,
};
