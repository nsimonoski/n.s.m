import { DirectoryResponseDto, FileResponseDto, ContextMenu } from '@org/shared/contracts';

export interface ContextMenuEvent {
  mouseEvent: MouseEvent;
  node: DirectoryResponseDto | FileResponseDto | null;
}

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

export interface ResizeState {
  isResizing: boolean;
  startX: number;
  startWidth: number;
}
