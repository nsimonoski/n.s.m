import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { simpleGit, SimpleGit } from 'simple-git';
import type {
  GitBranchDto,
  GitFileChange,
  GitLogEntryDto,
  GitStatusDto,
} from '@org/shared/contracts';
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
          'index',
        ),
        unstaged: this.mapFileChanges(
          result.files
            .filter((f) => f.working_dir !== ' ' && f.working_dir !== '?')
            .map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir })),
          'working_dir',
        ),
        untracked: result.not_added,
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async listBranches(repoPath: string): Promise<GitBranchDto[]> {
    try {
      const git = this.git(repoPath);
      const result = await git.branch(['-a']);

      const branches = await Promise.all(
        result.all.map(async (name) => {
          const log = await git.log({ maxCount: 1, from: name });
          const latest = log.latest;

          return {
            name: name.replace(/^remotes\//, ''),
            current: name === result.current,
            remote: name.startsWith('remotes/'),
            lastCommit: {
              hash: latest?.hash ?? '',
              message: latest?.message ?? '',
              body: latest?.body ?? '',
              author: latest?.author_name ?? '',
              date: latest?.date ?? '',
              filesChanged: latest?.diff?.changed ?? 0,
              insertions: latest?.diff?.insertions ?? 0,
              deletions: latest?.diff?.deletions ?? 0,
            },
          };
        }),
      );

      return branches;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async log(repoPath: string, limit = 20): Promise<GitLogEntryDto[]> {
    try {
      const result = await this.git(repoPath).log({
        maxCount: limit,
        '--stat': null,
      });

      return result.all.map((entry) => ({
        hash: entry.hash,
        message: entry.message,
        body: entry.body,
        author: entry.author_name,
        date: entry.date,
        filesChanged: entry.diff?.changed ?? 0,
        insertions: entry.diff?.insertions ?? 0,
        deletions: entry.diff?.deletions ?? 0,
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
      const git = this.git(repoPath);
      const localName = branch.replace(/^origin\//, '');

      if (localName !== branch) {
        const locals = await git.branchLocal();
        if (!locals.all.includes(localName)) {
          await git.checkout(['-b', localName, branch]);
          return;
        }
      }

      await git.checkout(localName);
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
        body: latest?.body ?? '',
        author: latest?.author_name ?? '',
        date: latest?.date ?? new Date().toISOString(),
        filesChanged: latest?.diff?.changed ?? 0,
        insertions: latest?.diff?.insertions ?? 0,
        deletions: latest?.diff?.deletions ?? 0,
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

  async discard(repoPath: string, paths: string[]): Promise<void> {
    try {
      const git = this.git(repoPath);
      const status = await git.status();
      const untracked = new Set(status.not_added);
      const tracked = paths.filter((p) => !untracked.has(p));
      const untrackedPaths = paths.filter((p) => untracked.has(p));

      if (tracked.length > 0) {
        await git.checkout(['--', ...tracked]);
      }
      if (untrackedPaths.length > 0) {
        await git.clean('f', ['--', ...untrackedPaths]);
      }
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

  async stash(repoPath: string): Promise<void> {
    try {
      await this.git(repoPath).stash(['push']);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async stashPop(repoPath: string): Promise<void> {
    try {
      await this.git(repoPath).stash(['pop']);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async stashApply(repoPath: string): Promise<void> {
    try {
      await this.git(repoPath).stash(['apply']);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async configUser(repoPath: string, name: string, email: string): Promise<void> {
    try {
      const git = this.git(repoPath);
      await git.addConfig('user.name', name);
      await git.addConfig('user.email', email);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async checkoutOrCreateBranch(repoPath: string, branch: string): Promise<void> {
    try {
      const git = this.git(repoPath);
      const locals = await git.branchLocal();

      if (locals.all.includes(branch)) {
        await git.checkout(branch);
        return;
      }

      const remotes = await git.branch(['-r']);
      if (remotes.all.includes(`origin/${branch}`)) {
        await git.checkout(['-b', branch, `origin/${branch}`]);
        return;
      }

      await git.checkoutLocalBranch(branch);
      await git.push(['--set-upstream', 'origin', branch]);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async showDiff(repoPath: string, filePath: string, ref = 'HEAD'): Promise<string> {
    try {
      return await this.git(repoPath).show([`${ref}:${filePath}`]);
    } catch {
      return '';
    }
  }

  private mapFileChanges(
    files: { path: string; index: string; working_dir: string }[],
    source: 'index' | 'working_dir',
  ): GitFileChange[] {
    return files.map((file) => ({
      path: file.path,
      status: this.mapStatusCode(file[source]),
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

  private mapError(error: unknown): ForbiddenException | InternalServerErrorException {
    const message = error instanceof Error ? error.message : 'Unknown git error';
    const lower = message.toLowerCase();

    if (
      lower.includes('permission') ||
      lower.includes('denied') ||
      lower.includes('protected branch')
    ) {
      return new ForbiddenException('Insufficient permissions to perform this git operation');
    }

    return new InternalServerErrorException(message);
  }
}
