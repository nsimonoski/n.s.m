import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceControl } from '@org/shared/contracts';
import { AuthGuard } from '../auth/auth.guard';
import { VoiceRateLimitGuard } from './voice-rate-limit.guard';
import { VoiceService } from './voice.service';

interface UploadedFileDto {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@UseGuards(AuthGuard, VoiceRateLimitGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @UploadedFile() file: UploadedFileDto,
  ): Promise<VoiceControl.TranscribeResponseDto> {
    const text = await this.voiceService.transcribe(file.buffer, file.mimetype);
    return { text };
  }

  @Post('parse-intent')
  async parseIntent(@Body('text') text: string): Promise<VoiceControl.ParseIntentResponseDto> {
    return this.voiceService.parseIntent(text);
  }

  @Post('command')
  @UseInterceptors(FileInterceptor('audio'))
  async command(@UploadedFile() file: UploadedFileDto): Promise<VoiceControl.VoiceCommandResult> {
    return this.voiceService.processCommand(file.buffer, file.mimetype);
  }
}
