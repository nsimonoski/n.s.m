import { VoiceControl } from '@org/shared/contracts';

export interface VoiceCommandDescriptor {
  intent: VoiceControl.VoiceIntent;
  label: string;
  category: 'git' | 'editor' | 'layout' | 'ai' | 'terminal' | 'file';
  requiredParams: string[];
}

export const VOICE_COMMANDS: VoiceCommandDescriptor[] = [
  {
    intent: VoiceControl.VoiceIntent.GitCommit,
    label: 'Commit',
    category: 'git',
    requiredParams: ['message'],
  },
  { intent: VoiceControl.VoiceIntent.GitPush, label: 'Push', category: 'git', requiredParams: [] },
  {
    intent: VoiceControl.VoiceIntent.GitStageAll,
    label: 'Stage All',
    category: 'git',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.GitStash,
    label: 'Stash',
    category: 'git',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.EditorSave,
    label: 'Save File',
    category: 'editor',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.EditorCloseTab,
    label: 'Close Tab',
    category: 'editor',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.LayoutToggleTerminal,
    label: 'Toggle Terminal',
    category: 'layout',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.LayoutSwitchPanel,
    label: 'Switch Panel',
    category: 'layout',
    requiredParams: ['panel'],
  },
  {
    intent: VoiceControl.VoiceIntent.AiChat,
    label: 'AI Chat',
    category: 'ai',
    requiredParams: ['message'],
  },
  {
    intent: VoiceControl.VoiceIntent.AiExplain,
    label: 'Explain File',
    category: 'ai',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.TerminalRun,
    label: 'Run Command',
    category: 'terminal',
    requiredParams: ['command'],
  },
  {
    intent: VoiceControl.VoiceIntent.FileCreate,
    label: 'Create File',
    category: 'file',
    requiredParams: ['path'],
  },
  {
    intent: VoiceControl.VoiceIntent.DirCreate,
    label: 'Create Directory',
    category: 'file',
    requiredParams: ['path'],
  },
  {
    intent: VoiceControl.VoiceIntent.TerminalClear,
    label: 'Clear Terminal',
    category: 'terminal',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.TerminalNewSession,
    label: 'New Terminal',
    category: 'terminal',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.TerminalKill,
    label: 'Kill Process',
    category: 'terminal',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.AiReview,
    label: 'Review Code',
    category: 'ai',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.AiRefactor,
    label: 'Refactor Code',
    category: 'ai',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.AiFixError,
    label: 'Fix Error',
    category: 'ai',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.GitStashPop,
    label: 'Pop Stash',
    category: 'git',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.GitUnstageAll,
    label: 'Unstage All',
    category: 'git',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.GitDiscardAll,
    label: 'Discard Changes',
    category: 'git',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.GitCheckout,
    label: 'Checkout Branch',
    category: 'git',
    requiredParams: ['branch'],
  },
  {
    intent: VoiceControl.VoiceIntent.EditorCloseAll,
    label: 'Close All Tabs',
    category: 'editor',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.EditorCloseOthers,
    label: 'Close Other Tabs',
    category: 'editor',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.LayoutToggleSidebar,
    label: 'Toggle Sidebar',
    category: 'layout',
    requiredParams: [],
  },
  {
    intent: VoiceControl.VoiceIntent.AiClearChat,
    label: 'Clear Chat',
    category: 'ai',
    requiredParams: [],
  },
];
