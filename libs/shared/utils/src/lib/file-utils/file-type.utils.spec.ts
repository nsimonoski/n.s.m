import { Enums } from '@org/shared/contracts';
import { getFileTypeFromExtension } from './file-type.utils';

describe('getFileTypeFromExtension', () => {
  it('should return TS for "ts"', () => {
    expect(getFileTypeFromExtension('ts')).toBe(Enums.FileType.TS);
  });

  it('should return JS for "js"', () => {
    expect(getFileTypeFromExtension('js')).toBe(Enums.FileType.JS);
  });

  it('should return HTML for "html"', () => {
    expect(getFileTypeFromExtension('html')).toBe(Enums.FileType.HTML);
  });

  it('should return CSS for "css"', () => {
    expect(getFileTypeFromExtension('css')).toBe(Enums.FileType.CSS);
  });

  it('should return SCSS for "scss"', () => {
    expect(getFileTypeFromExtension('scss')).toBe(Enums.FileType.SCSS);
  });

  it('should return JSON for "json"', () => {
    expect(getFileTypeFromExtension('json')).toBe(Enums.FileType.JSON);
  });

  it('should return MD for "md"', () => {
    expect(getFileTypeFromExtension('md')).toBe(Enums.FileType.MD);
  });

  it('should return JPG for "jpeg"', () => {
    expect(getFileTypeFromExtension('jpeg')).toBe(Enums.FileType.JPG);
  });

  it('should return SVG for "svg"', () => {
    expect(getFileTypeFromExtension('svg')).toBe(Enums.FileType.SVG);
  });

  it('should return PDF for "pdf"', () => {
    expect(getFileTypeFromExtension('pdf')).toBe(Enums.FileType.PDF);
  });

  it('should be case-insensitive', () => {
    expect(getFileTypeFromExtension('TS')).toBe(Enums.FileType.TS);
    expect(getFileTypeFromExtension('Json')).toBe(Enums.FileType.JSON);
  });

  it('should return OTHER for unknown extension', () => {
    expect(getFileTypeFromExtension('xyz')).toBe(Enums.FileType.OTHER);
  });

  it('should return OTHER for undefined', () => {
    expect(getFileTypeFromExtension(undefined)).toBe(Enums.FileType.OTHER);
  });

  it('should return OTHER for empty string', () => {
    expect(getFileTypeFromExtension('')).toBe(Enums.FileType.OTHER);
  });
});
