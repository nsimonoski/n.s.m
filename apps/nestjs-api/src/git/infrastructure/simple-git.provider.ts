import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { simpleGit, SimpleGit } from 'simple-git';
import type { GitFileChange, GitLogEntryDto, GitStatusDto } from '@org/shared/contracts';
import { GitFileStatus } from '@org/shared/contracts';
import { GitProvider } from '../domain/git.provider';

@Injectable()
export class SimpleGitProvider extends GitProvider {
  private git(repoPath: string): SimpleGit {
    return simpleGit(repoPath);
  }

  async status(repoPath: string): Promise<GitStatusDto> {
    try {
      const result = await this.git(repoPath).status();

      return {
        branch: result.current ?? '',
        ahead: result.ahead,
        behind: result.behind,
        staged: this.mapFileChanges(
          result.files
            .filter((f) => f.index !== ' ' && f.index !== '?')
            .map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir })),
        ),
        unstaged: this.mapFileChanges(
          result.files
            .filter((f) => f.working_dir !== ' ' && f.working_dir !== '?')
            .map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir })),
        ),
        untracked: result.not_added,
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async log(repoPath: string, limit = 20): Promise<GitLogEntryDto[]> {
    try {
      const result = await this.git(repoPath).log({ maxCount: limit });

      return result.all.map((entry) => ({
        hash: entry.hash,
        message: entry.message,
        author: entry.author_name,
        date: entry.date,
      }));
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async clone(url: string, path: string): Promise<void> {
    try {
      await simpleGit().clone(url, path);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async checkout(repoPath: string, branch: string): Promise<void> {
    try {
      await this.git(repoPath).checkout(branch);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async fetch(repoPath: string): Promise<void> {
    try {
      await this.git(repoPath).fetch();
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async pull(repoPath: string, remote?: string, branch?: string): Promise<void> {
    try {
      await this.git(repoPath).pull(remote, branch);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async push(repoPath: string, remote?: string, branch?: string): Promise<void> {
    try {
      const args = [remote ?? 'origin', branch ?? ''].filter(Boolean);
      await this.git(repoPath).push(args);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async commit(repoPath: string, message: string): Promise<GitLogEntryDto> {
    try {
      const result = await this.git(repoPath).commit(message);
      const log = await this.git(repoPath).log({ maxCount: 1 });
      const latest = log.latest;

      return {
        hash: latest?.hash ?? result.commit,
        message: latest?.message ?? message,
        author: latest?.author_name ?? '',
        date: latest?.date ?? new Date().toISOString(),
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async stage(repoPath: string, paths: string[]): Promise<void> {
    try {
      await this.git(repoPath).add(paths);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async unstage(repoPath: string, paths: string[]): Promise<void> {
    try {
      await this.git(repoPath).reset(['HEAD', '--', ...paths]);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async undoCommit(repoPath: string): Promise<void> {
    try {
      await this.git(repoPath).reset(['--soft', 'HEAD~1']);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapFileChanges(
    files: { path: string; index: string; working_dir: string }[],
  ): GitFileChange[] {
    return files.map((file) => ({
      path: file.path,
      status: this.mapStatusCode(file.index || file.working_dir),
    }));
  }

  private mapStatusCode(code: string): GitFileStatus {
    switch (code) {
      case 'A':
        return GitFileStatus.ADDED;
      case 'M':
        return GitFileStatus.MODIFIED;
      case 'D':
        return GitFileStatus.DELETED;
      case 'R':
        return GitFileStatus.RENAMED;
      case 'C':
        return GitFileStatus.COPIED;
      default:
        return GitFileStatus.MODIFIED;
    }
  }

  private mapError(error: unknown): InternalServerErrorException {
    const message = error instanceof Error ? error.message : 'Unknown git error';
    return new InternalServerErrorException(message);
  }
}
