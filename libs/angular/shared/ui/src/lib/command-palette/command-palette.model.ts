export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  divider?: boolean;
  actionIcon?: 'speaker';
}
