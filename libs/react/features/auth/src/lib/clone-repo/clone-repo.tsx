import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@org/react-data-access';
import './clone-repo.scss';

export function CloneRepo() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  const [repoUrl, setRepoUrl] = useState('https://github.com/nsimonoski/n.s.m');

  async function handleClone(): Promise<void> {
    const url = repoUrl.trim();
    if (!url) return;
    await useAuthStore.getState().cloneRepo(url);
    const { workspace } = useAuthStore.getState();
    if (workspace?.ready) {
      navigate('/ide');
    }
  }

  async function handleLogout(): Promise<void> {
    await useAuthStore.getState().logout();
    navigate('/login');
  }

  return (
    <div className="clone-repo-page">
      <div className="clone-repo-card">
        <div className="header">
          <h1 className="title">Clone a Repository</h1>
          {profile && (
            <div className="user-info">
              {profile.avatarUrl && (
                <img src={profile.avatarUrl} alt={profile.username} className="avatar" />
              )}
              <span className="username">{profile.username}</span>
              <button className="btn-link" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="clone-form">
          <label className="label" htmlFor="repoUrl">
            GitHub repository URL
          </label>
          <div className="input-row">
            <input
              id="repoUrl"
              type="text"
              className="input"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            />
            <button
              className="btn btn-primary"
              onClick={handleClone}
              disabled={isLoading || !repoUrl}
            >
              {isLoading ? 'Cloning...' : 'Clone'}
            </button>
          </div>

          {errorMessage && <p className="error">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
}
