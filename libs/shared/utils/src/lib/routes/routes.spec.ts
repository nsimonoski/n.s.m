import { AppRoutes } from './routes';

describe('AppRoutes', () => {
  it('should have correct static routes', () => {
    expect(AppRoutes.login).toBe('/login');
    expect(AppRoutes.ide.root).toBe('/ide');
    expect(AppRoutes.ide.explorer).toBe('/ide/explorer');
    expect(AppRoutes.ide.git).toBe('/ide/git');
    expect(AppRoutes.ide.ai).toBe('/ide/ai');
    expect(AppRoutes.ide.cloneRepo).toBe('/ide/clone-repo');
  });

  describe('explorerWithFile', () => {
    it('should encode file path', () => {
      expect(AppRoutes.ide.explorerWithFile('/src/app.ts')).toBe(
        '/ide/explorer?filePath=%2Fsrc%2Fapp.ts',
      );
    });

    it('should encode special characters', () => {
      expect(AppRoutes.ide.explorerWithFile('/path with spaces/file.ts')).toBe(
        '/ide/explorer?filePath=%2Fpath%20with%20spaces%2Ffile.ts',
      );
    });
  });

  describe('withFile', () => {
    it('should strip existing query and append filePath', () => {
      expect(AppRoutes.ide.withFile('/ide/explorer?old=param', '/new.ts')).toBe(
        '/ide/explorer?filePath=%2Fnew.ts',
      );
    });

    it('should work with URL without query', () => {
      expect(AppRoutes.ide.withFile('/ide/git', '/src/file.ts')).toBe(
        '/ide/git?filePath=%2Fsrc%2Ffile.ts',
      );
    });
  });

  describe('panel', () => {
    it('should return panel route without filePath', () => {
      expect(AppRoutes.ide.panel('explorer')).toBe('/ide/explorer');
    });

    it('should return panel route with encoded filePath', () => {
      expect(AppRoutes.ide.panel('explorer', '/src/app.ts')).toBe(
        '/ide/explorer?filePath=%2Fsrc%2Fapp.ts',
      );
    });
  });
});
