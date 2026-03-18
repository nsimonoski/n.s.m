import { DirectoryResponseDto, FileResponseDto, ContextMenu } from '@org/shared/contracts';

export interface ContextMenuActionEvent {
  action: ContextMenu.Action;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export interface ContextMenuTemplateContext {
  $implicit: ContextMenuState;
  close: () => void;
}
