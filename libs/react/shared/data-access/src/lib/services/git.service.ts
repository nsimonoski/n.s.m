import axios from 'axios';
import type {
  GitBranchDto,
  GitLogEntryDto,
  GitShowResponseDto,
  GitStatusDto,
  GitStatusTreeResponseDto,
} from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

const API = `${Environment.API_BASE_URL}/git`;

export const gitService = {
  getStatus: (path: string) =>
    axios.get<GitStatusDto>(`${API}/status`, { params: { path } }).then((r) => r.data),

  getStatusTree: (path: string) =>
    axios
      .get<GitStatusTreeResponseDto>(`${API}/status/tree`, { params: { path } })
      .then((r) => r.data),

  stage: (repoPath: string, paths: string[]) =>
    axios.post<void>(`${API}/stage`, { paths }, { params: { path: repoPath } }).then((r) => r.data),

  unstage: (repoPath: string, paths: string[]) =>
    axios
      .post<void>(`${API}/unstage`, { paths }, { params: { path: repoPath } })
      .then((r) => r.data),

  discard: (repoPath: string, paths: string[]) =>
    axios
      .post<void>(`${API}/discard`, { paths }, { params: { path: repoPath } })
      .then((r) => r.data),

  commit: (repoPath: string, message: string) =>
    axios
      .post<GitLogEntryDto>(`${API}/commit`, { message }, { params: { path: repoPath } })
      .then((r) => r.data),

  push: (repoPath: string) =>
    axios.post<void>(`${API}/push`, {}, { params: { path: repoPath } }).then((r) => r.data),

  showDiff: (repoPath: string, filePath: string) =>
    axios
      .get<GitShowResponseDto>(`${API}/show`, { params: { path: repoPath, filePath } })
      .then((r) => r.data),

  stash: (repoPath: string) =>
    axios.post<void>(`${API}/stash`, {}, { params: { path: repoPath } }).then((r) => r.data),

  stashPop: (repoPath: string) =>
    axios.post<void>(`${API}/stash/pop`, {}, { params: { path: repoPath } }).then((r) => r.data),

  stashApply: (repoPath: string) =>
    axios
      .post<void>(`${API}/stash/apply`, {}, { params: { path: repoPath } })
      .then((r) => r.data),

  listBranches: (path: string) =>
    axios.get<GitBranchDto[]>(`${API}/branches`, { params: { path } }).then((r) => r.data),

  checkout: (repoPath: string, branch: string) =>
    axios
      .post<void>(`${API}/checkout`, { branch }, { params: { path: repoPath } })
      .then((r) => r.data),

  getLog: (path: string, limit = 50) =>
    axios
      .get<GitLogEntryDto[]>(`${API}/log`, { params: { path, limit } })
      .then((r) => r.data),
};
