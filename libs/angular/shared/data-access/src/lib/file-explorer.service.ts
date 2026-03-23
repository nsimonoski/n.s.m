import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';
import { apiResult, ApiResult } from '@org/angular-utils';

@Injectable({
  providedIn: 'root',
})
export class FileExplorerService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/file-explorer`;

  constructor(private readonly http: HttpClient) {}

  readDirectory(path: string): Observable<ApiResult<DirectoryResponseDto>> {
    return this.http
      .post<DirectoryResponseDto>(`${this.API_BASE}/read`, { path })
      .pipe(apiResult());
  }

  getFile(path: string): Observable<ApiResult<FileResponseDto>> {
    return this.http
      .get<FileResponseDto>(`${this.API_BASE}/file`, {
        params: { path },
      })
      .pipe(apiResult());
  }

  getFiles(paths: string[]): Observable<ApiResult<FileResponseDto[]>> {
    return this.http
      .post<FileResponseDto[]>(`${this.API_BASE}/files`, { paths })
      .pipe(apiResult());
  }

  updateFile(file: FileResponseDto): Observable<ApiResult<FileResponseDto>> {
    return this.http.put<FileResponseDto>(`${this.API_BASE}/file`, file).pipe(apiResult());
  }

  rename(renameDto: RenameRequestDto): Observable<ApiResult<{ path: string }>> {
    return this.http.put<{ path: string }>(`${this.API_BASE}/rename`, renameDto).pipe(apiResult());
  }

  createFile(path: string, content?: string): Observable<ApiResult<FileResponseDto>> {
    return this.http
      .post<FileResponseDto>(`${this.API_BASE}/file`, { path, content })
      .pipe(apiResult());
  }

  createDirectory(path: string): Observable<ApiResult<DirectoryResponseDto>> {
    return this.http
      .post<DirectoryResponseDto>(`${this.API_BASE}/directory`, { path })
      .pipe(apiResult());
  }

  searchFiles(
    query: string,
    rootPath: string,
    limit = 20,
  ): Observable<ApiResult<FileResponseDto[]>> {
    return this.http
      .get<FileResponseDto[]>(`${this.API_BASE}/search`, {
        params: { query, path: rootPath, limit: limit.toString() },
      })
      .pipe(apiResult());
  }

  delete(path: string): Observable<ApiResult<{ path: string }>> {
    return this.http
      .request<{ path: string }>('DELETE', `${this.API_BASE}`, { body: { path } })
      .pipe(apiResult());
  }
}
