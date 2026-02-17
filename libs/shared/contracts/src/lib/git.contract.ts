import type { DirectoryResponseDto } from './directory.contract';

export interface GitStatusDto {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
}

export interface GitFileChange {
  path: string;
  status: GitFileStatus;
}

export enum GitFileStatus {
  ADDED = 'added',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
  COPIED = 'copied',
  UNTRACKED = 'untracked',
}

export interface GitLogEntryDto {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitBranchDto {
  name: string;
  current: boolean;
}

export interface GitCloneRequestDto {
  url: string;
  path: string;
}

export interface GitCommitRequestDto {
  message: string;
}

export interface GitStageRequestDto {
  paths: string[];
}

export interface GitCheckoutRequestDto {
  branch: string;
}

export interface GitPushRequestDto {
  remote?: string;
  branch?: string;
}

export interface GitPullRequestDto {
  remote?: string;
  branch?: string;
}

export interface GitStatusTreeResponseDto {
  branch: string;
  tree: DirectoryResponseDto;
  statusMap: Record<string, string>;
  ahead: number;
  behind: number;
  stagedCount: number;
  changesCount: number;
}

export const GIT_CHANGE_EVENT = 'git:change';
export const GIT_WATCH_EVENT = 'git:watch';

