export interface PanelDefinition {
  id: string;
  icon: string;
  tooltip: string;
}

export const panels: PanelDefinition[] = [
  { id: 'explorer', icon: 'icons/explorer.svg', tooltip: 'Explorer' },
  { id: 'git', icon: 'icons/source-control.svg', tooltip: 'Source Control' },
  { id: 'ai', icon: 'icons/ai.svg', tooltip: 'AI Assistant' },
];
