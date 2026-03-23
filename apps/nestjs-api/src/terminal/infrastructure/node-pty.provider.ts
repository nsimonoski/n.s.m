import * as pty from 'node-pty';
import { PtyProvider, PtyHandle } from '../domain/pty.provider';

export class NodePtyProvider extends PtyProvider {
  spawn(cols: number, rows: number, cwd: string): PtyHandle {
    const shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: process.env as Record<string, string>,
    });

    return {
      onData(callback: (data: string) => void): void {
        ptyProcess.onData(callback);
      },
      onExit(callback: (exitCode: number) => void): void {
        ptyProcess.onExit(({ exitCode }) => callback(exitCode));
      },
      write(data: string): void {
        ptyProcess.write(data);
      },
      resize(cols: number, rows: number): void {
        ptyProcess.resize(cols, rows);
      },
      kill(): void {
        ptyProcess.kill();
      },
    };
  }
}
