import { Injectable } from '@nestjs/common';
import { DockerContainerService } from '../../docker/docker-container.service';
import { PtyProvider, PtyHandle } from '../domain/pty.provider';

@Injectable()
export class DockerPtyProvider extends PtyProvider {
  constructor(private readonly dockerService: DockerContainerService) {
    super();
  }

  async createAndStartTerminal(
    cols: number,
    rows: number,
    _cwd: string,
    containerId: string | null,
  ): Promise<PtyHandle> {
    if (!containerId) {
      throw new Error('No workspace container available');
    }

    const { stream, exec } = await this.dockerService.execInContainer(containerId, cols, rows);

    const dataCallbacks: ((data: string) => void)[] = [];
    const exitCallbacks: ((exitCode: number) => void)[] = [];

    stream.on('data', (chunk: Buffer) => {
      const data = chunk.toString('utf-8');
      for (const cb of dataCallbacks) cb(data);
    });

    stream.on('end', () => {
      for (const cb of exitCallbacks) cb(0);
    });

    stream.on('error', () => {
      for (const cb of exitCallbacks) cb(1);
    });

    return {
      onData(callback: (data: string) => void): void {
        dataCallbacks.push(callback);
      },
      onExit(callback: (exitCode: number) => void): void {
        exitCallbacks.push(callback);
      },
      write(data: string): void {
        stream.write(data);
      },
      resize(cols: number, rows: number): void {
        exec.resize({ h: rows, w: cols }).catch(() => { /* resize may fail after disconnect */ });
      },
      kill(): void {
        stream.end();
      },
    };
  }
}
