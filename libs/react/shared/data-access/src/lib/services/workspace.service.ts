import axios from 'axios';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { apiResult, Environment } from '@org/shared/utils';

const API = `${Environment.API_BASE_URL}/workspace`;

export const workspaceService = {
  cloneRepo: (repoUrl: string) =>
    apiResult(axios.post<WorkspaceStatusDto>(`${API}/clone`, { repoUrl }).then((r) => r.data)),

  cloneDemoRepo: () =>
    apiResult(axios.post<WorkspaceStatusDto>(`${API}/clone-demo`, {}).then((r) => r.data)),
};
