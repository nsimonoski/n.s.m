import { useSnackbarStore } from '@org/react-data-access';
import './snackbar.scss';

export function Snackbar() {
  const visible = useSnackbarStore((s) => s.visible);
  const message = useSnackbarStore((s) => s.message);
  const type = useSnackbarStore((s) => s.type);
  const dismiss = useSnackbarStore((s) => s.dismiss);

  if (!visible) return null;

  return (
    <div className="snackbar-container">
      <div className={`snackbar ${type}`}>
        <span className="snackbar-message">{message}</span>
        <button className="snackbar-dismiss" onClick={dismiss}>×</button>
      </div>
    </div>
  );
}
