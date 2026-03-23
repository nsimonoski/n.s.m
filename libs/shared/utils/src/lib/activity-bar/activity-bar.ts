export interface PanelDefinition {
  id: string;
  icon: string;
  tooltip: string;
}

export const explorer: PanelDefinition = {
  id: 'explorer',
  icon: 'icons/explorer.svg',
  tooltip: 'Explorer',
};
export const git: PanelDefinition = {
  id: 'git',
  icon: 'icons/source-control.svg',
  tooltip: 'Source Control',
};
export const ai: PanelDefinition = { id: 'ai', icon: 'icons/ai.svg', tooltip: 'AI Assistant' };
export const terminal: PanelDefinition = {
  id: 'terminal',
  icon: 'icons/terminal.svg',
  tooltip: 'Terminal',
};
