import { MonacoUtils } from './monaco.utils';
import { MonacoEditorUtils } from './monaco-editor.utils';
import { MonacoDiffEditorUtils } from './monaco-diff-editor.utils';

export { BASE_EDITOR_OPTIONS } from './monaco.utils';
export type {
  CodeEditor,
  DiffEditor,
  TextModel,
  EditorOptions,
  DiffEditorOptions,
  Disposable,
} from './monaco.utils';
export type { File, OpenFile } from './monaco.contract';
export { mapFile, createTabId } from './monaco.contract';

const loader = new MonacoUtils();
export const editorUtils = new MonacoEditorUtils(loader);
export const diffEditorUtils = new MonacoDiffEditorUtils(loader);
