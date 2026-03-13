import { Module } from '@nestjs/common';
import { FileSystemService } from '../common';
import { AuthGuard } from './auth.guard';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService, AuthGuard, FileSystemService],
  exports: [SessionService, AuthGuard],
})
export class AuthModule {}
