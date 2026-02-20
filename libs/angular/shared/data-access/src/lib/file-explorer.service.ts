import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';

@Injectable({
  providedIn: 'root',
})
export class FileExplorerService {
  private readonly API_BASE = 'http://localhost:3000/api/file-explorer';

  constructor(private readonly http: HttpClient) {}

  readDirectory(path: string): Observable<DirectoryResponseDto> {
    return this.http.post<DirectoryResponseDto>(`${this.API_BASE}/read`, { path });
  }

  getFile(path: string): Observable<FileResponseDto> {
    return this.http.get<FileResponseDto>(`${this.API_BASE}/file`, {
      params: { path: encodeURIComponent(path) },
    });
  }

  getFiles(paths: string[]): Observable<FileResponseDto[]> {
    return this.http.post<FileResponseDto[]>(`${this.API_BASE}/files`, {
      paths: paths.map(encodeURIComponent),
    });
  }

  updateFile(file: FileResponseDto): Observable<FileResponseDto> {
    return this.http.put<FileResponseDto>(`${this.API_BASE}/file`, file);
  }

  rename(renameDto: RenameRequestDto): Observable<{ path: string }> {
    return this.http.put<{ path: string }>(`${this.API_BASE}/rename`, renameDto);
  }

  createFile(path: string, content?: string): Observable<FileResponseDto> {
    return this.http.post<FileResponseDto>(`${this.API_BASE}/file`, { path, content });
  }

  createDirectory(path: string): Observable<DirectoryResponseDto> {
    return this.http.post<DirectoryResponseDto>(`${this.API_BASE}/directory`, { path });
  }

  searchFiles(query: string, rootPath: string, limit = 20): Observable<FileResponseDto[]> {
    return this.http.get<FileResponseDto[]>(`${this.API_BASE}/search`, {
      params: {
        query: encodeURIComponent(query),
        path: encodeURIComponent(rootPath),
        limit: limit.toString(),
      },
    });
  }

  delete(path: string): Observable<{ path: string }> {
    return this.http.request<{ path: string }>('DELETE', `${this.API_BASE}`, { body: { path } });
  }
}
