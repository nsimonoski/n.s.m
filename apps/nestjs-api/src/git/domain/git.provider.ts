import type { GitBranchDto, GitLogEntryDto, GitStatusDto } from '@org/shared/contracts';

export abstract class GitProvider {
  abstract status(repoPath: string): Promise<GitStatusDto>;
  abstract listBranches(repoPath: string): Promise<GitBranchDto[]>;
  abstract log(repoPath: string, limit?: number): Promise<GitLogEntryDto[]>;
  abstract clone(url: string, path: string): Promise<void>;
  abstract checkout(repoPath: string, branch: string): Promise<void>;
  abstract fetch(repoPath: string): Promise<void>;
  abstract pull(repoPath: string, remote?: string, branch?: string): Promise<void>;
  abstract push(repoPath: string, remote?: string, branch?: string): Promise<void>;
  abstract commit(repoPath: string, message: string): Promise<GitLogEntryDto>;
  abstract stage(repoPath: string, paths: string[]): Promise<void>;
  abstract unstage(repoPath: string, paths: string[]): Promise<void>;
  abstract discard(repoPath: string, paths: string[]): Promise<void>;
  abstract undoCommit(repoPath: string): Promise<void>;
  abstract showDiff(repoPath: string, filePath: string, ref?: string): Promise<string>;
  abstract stash(repoPath: string): Promise<void>;
  abstract stashPop(repoPath: string): Promise<void>;
  abstract stashApply(repoPath: string): Promise<void>;
  abstract setRemoteUrl(repoPath: string, remote: string, url: string): Promise<void>;
  abstract configUser(repoPath: string, name: string, email: string): Promise<void>;
  abstract checkoutOrCreateBranch(repoPath: string, branch: string, sourceBranch?: string): Promise<void>;
}
