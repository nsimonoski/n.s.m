import { Body, Controller, Header, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import type { Ai } from '@org/shared/contracts';
import { RateLimitExpensive } from '../common';
import { AuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';

@RateLimitExpensive()
@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  sendMessage(@Body() body: Ai.ChatRequestDto, @Res() res: Response): void {
    res.flushHeaders();

    this.aiService.getResponse(body).subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      complete: () => {
        res.end();
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ delta: '', done: true, error: String(err) })}\n\n`);
        res.end();
      },
    });
  }
}
