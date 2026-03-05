import { Module } from '@nestjs/common';
import { FileExplorerController } from './file-explorer.controller';
import { FileExplorerGateway } from './file-explorer.gateway';
import { FileSystemProvider } from './domain/file-system.provider';
import { LocalFileSystemProvider } from './infrasturcure/local-file-system.provider';
import { FileSystemService, FileWatcherService } from '../common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FileExplorerController],
  providers: [
    {
      provide: FileSystemProvider,
      useClass: LocalFileSystemProvider,
    },
    FileSystemService,
    FileWatcherService,
    FileExplorerGateway,
  ],
})
export class FileExplorerModule {}
