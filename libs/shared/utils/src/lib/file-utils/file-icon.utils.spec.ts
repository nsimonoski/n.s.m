import { Enums } from '@org/shared/contracts';
import { getFileIcon, getExpandIcon } from './file-icon.utils';

describe('getFileIcon', () => {
  it('should return folder icon for directory (collapsed)', () => {
    const icon = getFileIcon(Enums.FileType.DIRECTORY, false);
    expect(icon.iconClass).toBe('codicon-folder');
    expect(icon.color).toBe('var(--icon-folder)');
  });

  it('should return opened folder icon for expanded directory', () => {
    const icon = getFileIcon(Enums.FileType.DIRECTORY, true);
    expect(icon.iconClass).toBe('codicon-folder-opened');
  });

  it('should return TS icon', () => {
    const icon = getFileIcon(Enums.FileType.TS);
    expect(icon.iconClass).toBe('codicon-symbol-method');
    expect(icon.color).toBe('var(--icon-ts)');
  });

  it('should return JS icon', () => {
    expect(getFileIcon(Enums.FileType.JS).color).toBe('var(--icon-js)');
  });

  it('should return HTML icon', () => {
    expect(getFileIcon(Enums.FileType.HTML).iconClass).toBe('codicon-code');
  });

  it('should return JSON icon', () => {
    expect(getFileIcon(Enums.FileType.JSON).iconClass).toBe('codicon-json');
  });

  it('should return MD icon', () => {
    expect(getFileIcon(Enums.FileType.MD).iconClass).toBe('codicon-markdown');
  });

  it('should return PDF icon', () => {
    expect(getFileIcon(Enums.FileType.PDF).iconClass).toBe('codicon-file-pdf');
  });

  it('should return OTHER icon for unknown type', () => {
    const icon = getFileIcon(Enums.FileType.OTHER);
    expect(icon.iconClass).toBe('codicon-file');
    expect(icon.color).toBe('var(--icon-txt)');
  });
});

describe('getExpandIcon', () => {
  it('should return chevron-down when expanded', () => {
    expect(getExpandIcon(true)).toBe('codicon-chevron-down');
  });

  it('should return chevron-right when collapsed', () => {
    expect(getExpandIcon(false)).toBe('codicon-chevron-right');
  });
});
