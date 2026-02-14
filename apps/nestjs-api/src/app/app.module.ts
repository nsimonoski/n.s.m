import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileExplorerModule } from '../file-explorer/file-explorer.module';

@Module({
  imports: [FileExplorerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
