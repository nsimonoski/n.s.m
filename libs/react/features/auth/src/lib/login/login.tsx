import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@org/react-data-access';
import './login.scss';

export function Login() {
  const navigate = useNavigate();
  const isLoading = useAuthStore((s) => s.isLoading);
  const githubAuthUrl = useAuthStore((s) => s.githubAuthUrl);
  const guestLogin = useAuthStore((s) => s.guestLogin);

  async function handleGuestLogin(): Promise<void> {
    await guestLogin();
    const { workspace } = useAuthStore.getState();
    navigate(workspace?.ready ? '/ide' : '/ide/clone-repo');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="title">kod3.dev</h1>
        <p className="subtitle">
          A browser-based IDE built in an Nx monorepo with React, NestJS &amp; Monaco Editor
        </p>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = githubAuthUrl())}
            disabled={isLoading}
          >
            <i className="codicon codicon-github"></i>
            Sign in with GitHub
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button className="btn btn-secondary" onClick={handleGuestLogin} disabled={isLoading}>
            <i className="codicon codicon-play"></i>
            Continue as Guest
          </button>
        </div>

        <p className="note">
          Guest mode opens the source code of this IDE in read-only mode. Sign in with GitHub to
          clone your own repos with full read/write access.
        </p>

        <div className="version-switch">
          <a href="https://kod3.dev/angular" target="_blank" rel="noopener noreferrer">
            <i className="codicon codicon-arrow-swap"></i>
            <span>Try the Angular version</span>
          </a>
        </div>

        <div className="developer">
          <span>Built by</span>
          <a
            href="https://www.linkedin.com/in/nenad-simonoski-nsm/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Nenad Simonoski</span>
          </a>
          <span>|</span>
          <a href="https://github.com/nsimonoski/n.s.m" target="_blank" rel="noopener noreferrer">
            <i className="codicon codicon-github"></i>
            <span>Source Code</span>
          </a>
          <span className="developer-break"></span>
          <a href="https://kod3.dev/angular/docs" target="_blank" rel="noopener noreferrer">
            <i className="codicon codicon-book"></i>
            <span>Docs</span>
          </a>
          <span>|</span>
          <a href="https://kod3.dev/angular/cv" target="_blank" rel="noopener noreferrer">
            <i className="codicon codicon-file-text"></i>
            <span>CV</span>
          </a>
        </div>
      </div>
    </div>
  );
}
