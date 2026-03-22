import { useThemeStore } from '@org/react-data-access';

export function ThemeToggle() {
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button className="footer-btn" onClick={toggleTheme} title="Toggle theme">
      <i className="codicon codicon-color-mode" />
    </button>
  );
}
