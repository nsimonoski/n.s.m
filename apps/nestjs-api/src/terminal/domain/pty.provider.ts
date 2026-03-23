export interface PtyHandle {
  onData(callback: (data: string) => void): void;
  onExit(callback: (exitCode: number) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}

export abstract class PtyProvider {
  abstract spawn(cols: number, rows: number, cwd: string): PtyHandle;
}
