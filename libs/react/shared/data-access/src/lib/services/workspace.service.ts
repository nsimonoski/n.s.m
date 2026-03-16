import axios from 'axios';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

const API = `${Environment.API_BASE_URL}/workspace`;

export const workspaceService = {
  cloneRepo: (repoUrl: string) =>
    axios.post<WorkspaceStatusDto>(`${API}/clone`, { repoUrl }).then((r) => r.data),
};
