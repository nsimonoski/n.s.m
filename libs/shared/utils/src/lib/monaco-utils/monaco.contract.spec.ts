import { Enums, type FileResponseDto } from '@org/shared/contracts';
import { createTabId, mapFile } from './monaco.contract';

describe('createTabId', () => {
  it('should return path for regular mode', () => {
    expect(createTabId('/src/app.ts', 'regular')).toBe('/src/app.ts');
  });

  it('should return path::diff for diff mode', () => {
    expect(createTabId('/src/app.ts', 'diff')).toBe('/src/app.ts::diff');
  });
});

describe('mapFile', () => {
  it('should map FileResponseDto to OpenFile', () => {
    const file: FileResponseDto = {
      id: '1',
      name: 'app.ts',
      path: '/src/app.ts',
      content: 'const x = 1;',
      updatedAt: '2024-01-01',
      type: Enums.FileType.TS,
      extension: 'ts',
    };

    const result = mapFile(file);

    expect(result.tabId).toBe('/src/app.ts');
    expect(result.path).toBe('/src/app.ts');
    expect(result.name).toBe('app.ts');
    expect(result.content).toBe('const x = 1;');
    expect(result.currentContent).toBe('const x = 1;');
    expect(result.originalContent).toBe('');
    expect(result.language).toBe('typescript');
    expect(result.type).toBe(Enums.FileType.TS);
    expect(result.extension).toBe('ts');
    expect(result.mode).toBe('regular');
    expect(result.isDirty).toBe(false);
  });

  it('should default content to empty string when undefined', () => {
    const file: FileResponseDto = {
      id: '2',
      name: 'readme.md',
      path: '/readme.md',
      updatedAt: '2024-01-01',
      type: Enums.FileType.MD,
    };

    const result = mapFile(file);
    expect(result.content).toBe('');
    expect(result.language).toBe('markdown');
  });

  it('should resolve language from extension when type has no mapping', () => {
    const file: FileResponseDto = {
      id: '3',
      name: 'style.less',
      path: '/style.less',
      updatedAt: '2024-01-01',
      type: Enums.FileType.OTHER,
      extension: 'less',
    };

    const result = mapFile(file);
    expect(result.language).toBe('less');
  });

  it('should default to plaintext for unknown type and extension', () => {
    const file: FileResponseDto = {
      id: '4',
      name: 'data.xyz',
      path: '/data.xyz',
      updatedAt: '2024-01-01',
      type: Enums.FileType.OTHER,
      extension: 'xyz',
    };

    const result = mapFile(file);
    expect(result.language).toBe('plaintext');
  });
});
