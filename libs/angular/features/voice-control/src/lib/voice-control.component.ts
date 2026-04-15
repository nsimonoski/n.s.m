import { Component, computed, inject, signal } from '@angular/core';
import { VoiceControl } from '@org/shared/contracts';
import { VoiceControlStore } from './voice-control.store';
import { CommandPaletteComponent, CommandPaletteItem } from '@org/angular/ui';
import { VoiceControl as VoiceControlUtils } from '@org/shared/utils';

@Component({
  selector: 'ide-voice-control',
  standalone: true,
  imports: [CommandPaletteComponent],
  templateUrl: './voice-control.component.html',
  styleUrls: ['./voice-control.component.scss'],
})
export class VoiceControlComponent {
  readonly store = inject(VoiceControlStore);

  readonly commandPaletteItems = computed(() => buildCommandPaletteItems());

  readonly confirmationSummary = computed(() => {
    const result = this.store.commandResult();
    if (!result) return null;

    const cmd = VoiceControlUtils.VOICE_COMMANDS.find((c) => c.intent === result.intent);
    let label = cmd?.label ?? result.intent;

    if (result.intent === VoiceControl.VoiceIntent.AiChain && result.steps?.length) {
      const stepLabels = result.steps.map((s) => {
        const stepCmd = VoiceControlUtils.VOICE_COMMANDS.find((c) => c.intent === s.intent);
        return stepCmd?.label ?? s.intent;
      });
      label = `Chain: ${stepLabels.join(' → ')}`;
    }

    const params = Object.entries(result.params).filter(([, v]) => v);
    const paramText = params.map(([k, v]) => `${k}: "${v}"`).join(', ');

    return { label, paramText };
  });

  readonly isUnknownCommand = computed(
    () => this.store.commandResult()?.intent === VoiceControl.VoiceIntent.Unknown,
  );

  readonly showOnboardingHint = signal(
    typeof window !== 'undefined' &&
      window.innerWidth < 768 &&
      !localStorage.getItem('voice-onboarding-seen'),
  );

  dismissOnboarding(): void {
    localStorage.setItem('voice-onboarding-seen', 'true');
    this.showOnboardingHint.set(false);
  }

  onCommandSelected(item: CommandPaletteItem): void {
    const cmd = VoiceControlUtils.VOICE_COMMANDS.find((c) => c.intent === item.id);
    if (cmd) {
      this.store.selectCommand(cmd);
    }
  }

  onCommandSpeak(item: CommandPaletteItem): void {
    const cmd = VoiceControlUtils.VOICE_COMMANDS.find((c) => c.intent === item.id);
    if (cmd?.voiceExample) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cmd.voiceExample.replace(/"/g, ''));
      utterance.rate = 0.9;
      utterance.voice = getNaturalVoice();
      speechSynthesis.speak(utterance);
    }
  }
}

function buildCommandPaletteItems(): CommandPaletteItem[] {
  const items: CommandPaletteItem[] = [];
  const categories = new Map<string, VoiceControlUtils.VoiceCommandDescriptor[]>();

  for (const cmd of VoiceControlUtils.VOICE_COMMANDS) {
    const group = categories.get(cmd.category) ?? [];
    group.push(cmd);
    categories.set(cmd.category, group);
  }

  const categoryLabels: Record<string, string> = {
    git: 'Git',
    editor: 'Editor',
    layout: 'Layout',
    ai: 'AI',
    terminal: 'Terminal',
    file: 'File',
    tool: 'Tools',
  };

  let isFirst = true;
  for (const [category, cmds] of categories) {
    if (!isFirst) {
      items.push({ id: `divider-${category}`, label: categoryLabels[category] ?? category, divider: true });
    } else {
      items.push({ id: `header-${category}`, label: categoryLabels[category] ?? category, divider: true });
    }
    isFirst = false;

    for (const cmd of cmds) {
      items.push({
        id: cmd.intent,
        label: cmd.label,
        description: cmd.voiceExample,
        actionIcon: 'speaker',
      });
    }
  }

  return items;
}

function getNaturalVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.startsWith('en'));

  const premium = english.find(
    (v) =>
      v.name.includes('Premium') ||
      v.name.includes('Enhanced') ||
      v.name.includes('Natural') ||
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Daniel'),
  );
  if (premium) return premium;

  return english.find((v) => v.localService) ?? english[0] ?? null;
}
