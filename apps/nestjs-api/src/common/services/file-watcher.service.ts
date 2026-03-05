import { Injectable } from '@nestjs/common';
import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import { PathUtils } from '../utils/path.utils';

@Injectable()
export class FileWatcherService {
  watchRepositoryForChanges(repoPath: string): FSWatcher {
    const ignoredDirs = ['node_modules', '.git', 'dist', '.nx', '.angular', '.cache'];

    return chokidar.watch(repoPath, {
      ignored: (filePath: string) =>
        ignoredDirs.some((dir) => PathUtils.getSegments(filePath).includes(dir)),
      ignoreInitial: true,
      persistent: true,
      usePolling: true,
      interval: 1000,
      depth: 10,
    });
  }

  watchGitForChanges(repoPath: string): FSWatcher {
    const gitDir = PathUtils.combine(repoPath, '.git');
    const watchedFiles = ['index', 'HEAD', 'refs', 'MERGE_HEAD', 'REBASE_HEAD'];
    const paths = watchedFiles.map((file) => PathUtils.combine(gitDir, file));

    return chokidar.watch(paths, {
      ignoreInitial: true,
      persistent: true,
      ignored: (filePath: string) => filePath.endsWith('.lock'),
      depth: 3,
    });
  }
}
