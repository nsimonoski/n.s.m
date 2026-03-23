export const TERMINAL_CREATE_EVENT = 'terminal:create';
export const TERMINAL_CREATED_EVENT = 'terminal:created';
export const TERMINAL_DATA_EVENT = 'terminal:data';
export const TERMINAL_RESIZE_EVENT = 'terminal:resize';
export const TERMINAL_CLOSE_EVENT = 'terminal:close';
export const TERMINAL_EXIT_EVENT = 'terminal:exit';
export const TERMINAL_ERROR_EVENT = 'terminal:error';

export interface TerminalCreateRequestDto {
  cols: number;
  rows: number;
  cwd: string;
}

export interface TerminalCreatedResponseDto {
  sessionId: string;
}

export interface TerminalDataDto {
  sessionId: string;
  data: string;
}

export interface TerminalResizeDto {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface TerminalCloseDto {
  sessionId: string;
}

export interface TerminalExitDto {
  sessionId: string;
  exitCode: number;
}

export interface TerminalErrorDto {
  message: string;
}
