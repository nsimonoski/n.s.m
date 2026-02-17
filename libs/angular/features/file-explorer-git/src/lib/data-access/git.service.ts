import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GitLogEntryDto, GitShowResponseDto, GitStatusDto, GitStatusTreeResponseDto } from '@org/shared/contracts';

@Injectable({
  providedIn: 'root',
})
export class GitService {
  private readonly API_BASE = 'http://localhost:3000/api/git';

  constructor(private readonly http: HttpClient) {}

  getStatus(path: string): Observable<GitStatusDto> {
    return this.http.get<GitStatusDto>(`${this.API_BASE}/status`, {
      params: { path },
    });
  }

  getStatusTree(path: string): Observable<GitStatusTreeResponseDto> {
    return this.http.get<GitStatusTreeResponseDto>(`${this.API_BASE}/status/tree`, {
      params: { path },
    });
  }

  stage(repoPath: string, paths: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/stage`, { paths }, {
      params: { path: repoPath },
    });
  }

  unstage(repoPath: string, paths: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/unstage`, { paths }, {
      params: { path: repoPath },
    });
  }

  discard(repoPath: string, paths: string[]): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/discard`, { paths }, {
      params: { path: repoPath },
    });
  }

  commit(repoPath: string, message: string): Observable<GitLogEntryDto> {
    return this.http.post<GitLogEntryDto>(`${this.API_BASE}/commit`, { message }, {
      params: { path: repoPath },
    });
  }

  push(repoPath: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/push`, {}, {
      params: { path: repoPath },
    });
  }

  showDiff(repoPath: string, filePath: string): Observable<GitShowResponseDto> {
    return this.http.get<GitShowResponseDto>(`${this.API_BASE}/show`, {
      params: { path: repoPath, filePath },
    });
  }
}
