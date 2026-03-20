import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GitBranchDto,
  GitLogEntryDto,
  GitShowResponseDto,
  GitStatusDto,
  GitStatusTreeResponseDto,
} from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';
import { apiResult, ApiResult } from '@org/angular-utils';

@Injectable({
  providedIn: 'root',
})
export class GitService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/git`;

  constructor(private readonly http: HttpClient) {}

  getStatus(path: string): Observable<ApiResult<GitStatusDto>> {
    return this.http
      .get<GitStatusDto>(`${this.API_BASE}/status`, { params: { path } })
      .pipe(apiResult());
  }

  getStatusTree(path: string): Observable<ApiResult<GitStatusTreeResponseDto>> {
    return this.http
      .get<GitStatusTreeResponseDto>(`${this.API_BASE}/status/tree`, { params: { path } })
      .pipe(apiResult());
  }

  stage(repoPath: string, paths: string[]): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/stage`, { paths }, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  unstage(repoPath: string, paths: string[]): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/unstage`, { paths }, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  discard(repoPath: string, paths: string[]): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/discard`, { paths }, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  commit(repoPath: string, message: string): Observable<ApiResult<GitLogEntryDto>> {
    return this.http
      .post<GitLogEntryDto>(`${this.API_BASE}/commit`, { message }, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  push(repoPath: string): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/push`, {}, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  showDiff(repoPath: string, filePath: string): Observable<ApiResult<GitShowResponseDto>> {
    return this.http
      .get<GitShowResponseDto>(`${this.API_BASE}/show`, { params: { path: repoPath, filePath } })
      .pipe(apiResult());
  }

  stash(repoPath: string): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/stash`, {}, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  stashPop(repoPath: string): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/stash/pop`, {}, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  stashApply(repoPath: string): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/stash/apply`, {}, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  listBranches(path: string): Observable<ApiResult<GitBranchDto[]>> {
    return this.http
      .get<GitBranchDto[]>(`${this.API_BASE}/branches`, { params: { path } })
      .pipe(apiResult());
  }

  getLog(path: string, limit?: number): Observable<ApiResult<GitLogEntryDto[]>> {
    return this.http
      .get<GitLogEntryDto[]>(`${this.API_BASE}/log`, {
        params: limit ? { path, limit: limit.toString() } : { path },
      })
      .pipe(apiResult());
  }

  checkout(repoPath: string, branch: string): Observable<ApiResult<void>> {
    return this.http
      .post<void>(`${this.API_BASE}/checkout`, { branch }, { params: { path: repoPath } })
      .pipe(apiResult());
  }

  createBranch(
    repoPath: string,
    branch: string,
    sourceBranch?: string,
  ): Observable<ApiResult<void>> {
    return this.http
      .post<void>(
        `${this.API_BASE}/create-branch`,
        { branch, sourceBranch },
        { params: { path: repoPath } },
      )
      .pipe(apiResult());
  }
}
