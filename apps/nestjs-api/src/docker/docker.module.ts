import { Global, Module } from '@nestjs/common';
import { DockerContainerService } from './docker-container.service';

@Global()
@Module({
  providers: [DockerContainerService],
  exports: [DockerContainerService],
})
export class DockerModule {}
