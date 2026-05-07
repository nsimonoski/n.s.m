import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VoiceControl } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/voice`;

  processCommand(
    audioBlob: Blob,
    lastIntent?: string,
  ): Observable<VoiceControl.VoiceCommandResult> {
    return new Observable((subscriber) => {
      this.sendAudio(audioBlob, lastIntent, subscriber).catch((err) => subscriber.error(err));
    });
  }

  private async sendAudio(
    audioBlob: Blob,
    lastIntent: string | undefined,
    subscriber: {
      next: (v: VoiceControl.VoiceCommandResult) => void;
      complete: () => void;
      error: (e: unknown) => void;
    },
  ): Promise<void> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (lastIntent) formData.append('lastIntent', lastIntent);

    const response = await fetch(`${this.API_BASE}/command`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 429) {
      subscriber.error(new Error('Daily voice command limit reached. Try again tomorrow.'));
      return;
    }

    if (!response.ok) {
      subscriber.error(new Error(`Voice command failed: HTTP ${response.status}`));
      return;
    }

    const result: VoiceControl.VoiceCommandResult = await response.json();
    subscriber.next(result);
    subscriber.complete();
  }
}
