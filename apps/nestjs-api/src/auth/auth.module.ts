import { Module } from '@nestjs/common';
import { CryptoService, FileSystemService } from '../common';
import { AuthGuard } from './auth.guard';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService, AuthGuard, FileSystemService, CryptoService],
  exports: [SessionService, AuthGuard],
})
export class AuthModule {}
