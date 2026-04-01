import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VoiceController } from './voice.controller';
import { VoiceRateLimitGuard } from './voice-rate-limit.guard';
import { VoiceService } from './voice.service';

@Module({
  imports: [AuthModule],
  controllers: [VoiceController],
  providers: [VoiceService, VoiceRateLimitGuard],
})
export class VoiceModule {}
