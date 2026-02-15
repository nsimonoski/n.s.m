import { Module } from '@nestjs/common';

import { FileExplorerModule } from '../file-explorer/file-explorer.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [FileExplorerModule, GitModule],
})
export class AppModule {}
