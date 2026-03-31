import { Component, computed, inject } from '@angular/core';
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
    const label = cmd?.label ?? result.intent;
    const params = Object.entries(result.params).filter(([, v]) => v);
    const paramText = params.map(([k, v]) => `${k}: "${v}"`).join(', ');

    return { label, paramText };
  });

  readonly isUnknownCommand = computed(
    () => this.store.commandResult()?.intent === VoiceControl.VoiceIntent.Unknown,
  );

  onCommandSelected(item: CommandPaletteItem): void {
    const cmd = VoiceControlUtils.VOICE_COMMANDS.find((c) => c.intent === item.id);
    if (cmd) {
      this.store.selectCommand(cmd);
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
      const paramHint = cmd.requiredParams.length > 0 ? ' (voice input)' : '';
      items.push({
        id: cmd.intent,
        label: cmd.label,
        description: `${categoryLabels[cmd.category]}${paramHint}`,
      });
    }
  }

  return items;
}
