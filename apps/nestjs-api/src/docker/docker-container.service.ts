import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import { EnvironmentVariables } from '../common/configs/env.config';

const WORKSPACE_IMAGE = 'nsm-workspace:latest';
const WORKSPACE_LABEL = 'nsm.workspace';

export interface DockerExecHandle {
  stream: NodeJS.ReadWriteStream;
  exec: Docker.Exec;
}

@Injectable()
export class DockerContainerService implements OnModuleInit {
  private readonly logger = new Logger(DockerContainerService.name);
  private readonly docker: Docker;
  private readonly workspaceNetwork: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const dockerHost = this.configService.get<string>(EnvironmentVariables.DOCKER_HOST);
    this.workspaceNetwork = this.configService.get<string>(EnvironmentVariables.WORKSPACE_NETWORK);

    if (dockerHost) {
      const url = new URL(dockerHost);
      this.docker = new Docker({ host: url.hostname, port: Number(url.port) });
      this.logger.log(`Using Docker host: ${dockerHost}`);
    } else {
      this.docker = new Docker();
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.docker.ping();
      this.logger.log('Docker connection established');
    } catch (error) {
      this.logger.warn(`Docker not available: ${(error as Error).message}`);
    }
  }

  async createWorkspaceContainer(sessionId: string, hostWorkspacePath: string): Promise<string> {
    const container = await this.docker.createContainer({
      Image: WORKSPACE_IMAGE,
      Labels: { [WORKSPACE_LABEL]: sessionId },
      HostConfig: {
        Binds: [`${hostWorkspacePath}:/workspace`, 'nsm-npm-cache:/home/workspace/.npm'],
        Memory: 1024 * 1024 * 1024,
        NanoCpus: 1 * 1e9,
        PidsLimit: 200,
        NetworkMode: this.workspaceNetwork ?? 'none',
        SecurityOpt: ['no-new-privileges'],
      },
      User: 'workspace',
      WorkingDir: '/workspace',
    });

    await container.start();
    this.logger.log(`Workspace container started: ${container.id} (session: ${sessionId})`);
    return container.id;
  }

  async removeContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 5 }).catch(() => {
        /* graceful stop may fail */
      });
      await container.remove({ force: true });
      this.logger.log(`Container removed: ${containerId}`);
    } catch (error) {
      this.logger.warn(`Failed to remove container ${containerId}: ${(error as Error).message}`);
    }
  }

  async execInContainer(
    containerId: string,
    cols: number,
    rows: number,
  ): Promise<DockerExecHandle> {
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Env: ['TERM=xterm-256color'],
    });

    const stream = await exec.start({ hijack: true, stdin: true, Tty: true });
    await exec.resize({ h: rows, w: cols });

    return { stream, exec };
  }

  async resizeExec(exec: Docker.Exec, cols: number, rows: number): Promise<void> {
    await exec.resize({ h: rows, w: cols });
  }

  async cleanupOrphanedContainers(activeSessionIds: string[]): Promise<void> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { label: [WORKSPACE_LABEL] },
      });

      for (const info of containers) {
        const sessionId = info.Labels[WORKSPACE_LABEL];
        if (!activeSessionIds.includes(sessionId)) {
          await this.removeContainer(info.Id);
          this.logger.log(`Cleaned up orphaned container for session: ${sessionId}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Orphan cleanup failed: ${(error as Error).message}`);
    }
  }
}
