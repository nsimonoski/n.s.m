export enum CommandType {
  CHAT = 'chat',
  EXPLAIN = 'explain',
  MODIFY = 'modify',
  PLAN = 'plan',
  DOCUMENT = 'document',
  TICKET = 'ticket',
}

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface FileContext {
  filePath: string;
  language: string;
  content: string;
}

export interface ChatRequestDto {
  message: string;
  command: CommandType;
  fileContext: FileContext | null;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  role: Role;
  content: string;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  modifiedContent?: string;
  error?: string;
}
