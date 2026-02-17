import { Module } from '@nestjs/common';
import { FileExplorerController } from './file-explorer.controller';
import { FileExplorerGateway } from './file-explorer.gateway';
import { FileSystemProvider } from './domain/file-system.provider';
import { LocalFileSystemProvider } from './infrasturcure/local-file-system.provider';
import { FileSystemErrorMapper } from './domain/file-system-error.mapper';

@Module({
  controllers: [FileExplorerController],
  providers: [
    {
      provide: FileSystemProvider,
      useClass: LocalFileSystemProvider,
    },
    FileSystemErrorMapper,
    FileExplorerGateway,
  ],
})
export class FileExplorerModule {}
