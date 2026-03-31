export enum VoiceIntent {
  GitCommit = 'git:commit',
  GitPush = 'git:push',
  GitStageAll = 'git:stage-all',
  GitStash = 'git:stash',
  EditorSave = 'editor:save',
  EditorCloseTab = 'editor:close-tab',
  LayoutToggleTerminal = 'layout:toggle-terminal',
  LayoutSwitchPanel = 'layout:switch-panel',
  AiChat = 'ai:chat',
  AiExplain = 'ai:explain',
  TerminalRun = 'terminal:run',
  FileCreate = 'file:create',
  DirCreate = 'dir:create',
  TerminalClear = 'terminal:clear',
  TerminalNewSession = 'terminal:new-session',
  TerminalKill = 'terminal:kill',
  AiReview = 'ai:review',
  AiRefactor = 'ai:refactor',
  AiFixError = 'ai:fix-error',
  GitStashPop = 'git:stash-pop',
  GitUnstageAll = 'git:unstage-all',
  GitDiscardAll = 'git:discard-all',
  GitCheckout = 'git:checkout',
  EditorCloseAll = 'editor:close-all',
  EditorCloseOthers = 'editor:close-others',
  LayoutToggleSidebar = 'layout:toggle-sidebar',
  AiClearChat = 'ai:clear-chat',
  Unknown = 'unknown',
}

export interface VoiceCommandResult {
  intent: VoiceIntent;
  params: Record<string, string>;
  rawTranscription: string;
  confidence: number;
}

export interface TranscribeResponseDto {
  text: string;
}

export interface ParseIntentResponseDto {
  intent: VoiceIntent;
  params: Record<string, string>;
  confidence: number;
}
