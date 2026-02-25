import { useEffect, useRef } from 'react';
import { MonacoUtils } from '@org/shared/utils';
import './monaco-editor.scss';

const SAMPLE_FILE = {
  path: '/sample.ts',
  currentContent: [
    `import { Component } from '@angular/core';`,
    ``,
    `@Component({`,
    `  selector: 'app-root',`,
    `  template: '<h1>Hello World</h1>',`,
    `})`,
    `export class AppComponent {}`,
    ``,
  ].join('\n'),
  originalContent: '',
  language: 'typescript',
  mode: 'regular' as const,
};

export function MonacoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = new MonacoUtils.MonacoService();
    const editorUtils = new MonacoUtils.MonacoEditorUtils(loader);

    loader.loadMonaco().then(() => {
      if (containerRef.current) {
        editorUtils.create(containerRef.current);
        editorUtils.switchToFile(SAMPLE_FILE);
      }
    });

    return () => editorUtils.dispose();
  }, []);

  return <div ref={containerRef} className="editor-container" />;
}
