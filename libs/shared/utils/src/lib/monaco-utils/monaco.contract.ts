import { Enums, FileResponseDto } from '@org/shared/contracts';

export interface File {
  path: string;
  currentContent: string;
  originalContent: string;
  language: string;
  mode: 'regular' | 'diff';
}

export interface OpenFile extends File {
  name: string;
  content: string;
  type: Enums.FileType;
  extension?: string;
  isDirty: boolean;
  updatedAt: string;
}

export function mapFile(file: FileResponseDto): OpenFile {
  const content = file.content ?? '';
  return {
    path: file.path,
    name: file.name,
    content,
    currentContent: content,
    originalContent: '',
    language: getMonacoLanguage(file.type, file.extension),
    type: file.type,
    extension: file.extension,
    mode: 'regular',
    isDirty: false,
    updatedAt: file.updatedAt,
  };
}

const FILE_TYPE_TO_LANGUAGE: Record<string, string> = {
  [Enums.FileType.TS]: 'typescript',
  [Enums.FileType.JS]: 'javascript',
  [Enums.FileType.HTML]: 'html',
  [Enums.FileType.CSS]: 'css',
  [Enums.FileType.SCSS]: 'scss',
  [Enums.FileType.JSON]: 'json',
  [Enums.FileType.MD]: 'markdown',
  [Enums.FileType.TXT]: 'plaintext',
  [Enums.FileType.SVG]: 'xml',
};

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mts: 'typescript',
  mjs: 'javascript',
  cts: 'typescript',
  cjs: 'javascript',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  sh: 'shell',
  bash: 'shell',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  sql: 'sql',
  graphql: 'graphql',
  dockerfile: 'dockerfile',
};

function getMonacoLanguage(type: Enums.FileType, extension?: string): string {
  const fromType = FILE_TYPE_TO_LANGUAGE[type];
  if (fromType) return fromType;

  if (extension) {
    const ext = extension.replace(/^\./, '').toLowerCase();
    return EXTENSION_TO_LANGUAGE[ext] ?? 'plaintext';
  }

  return 'plaintext';
}
