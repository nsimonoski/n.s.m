import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectoryResponseDto, FileResponseDto, RenameFileRequestDto } from '@org/shared/contracts';

@Injectable({
  providedIn: 'root',
})
export class FileExplorerService {
  private readonly API_BASE = 'http://localhost:3000/api/file-explorer';

  constructor(private readonly http: HttpClient) {}

  /**
   * Read directory contents
   */
  readDirectory(path: string): Observable<DirectoryResponseDto> {
    return this.http.post<DirectoryResponseDto>(`${this.API_BASE}/read`, { path });
  }

  /**
   * Get file content by ID/path
   */
  getFile(path: string): Observable<FileResponseDto> {
    return this.http.get<FileResponseDto>(`${this.API_BASE}/file`, {
      params: { path: encodeURIComponent(path) },
    });
  }

  /**
   * Update file content
   */
  updateFile(file: FileResponseDto): Observable<FileResponseDto> {
    return this.http.put<FileResponseDto>(`${this.API_BASE}/file`, file);
  }

  /**
   * Rename a file
   */
  renameFile(renameDto: RenameFileRequestDto): Observable<FileResponseDto> {
    return this.http.put<FileResponseDto>(`${this.API_BASE}/file/rename`, renameDto);
  }

  /**
   * Create a new file
   */
  createFile(path: string, content?: string): Observable<FileResponseDto> {
    return this.http.post<FileResponseDto>(`${this.API_BASE}/file`, { path, content });
  }

  /**
   * Create a new directory
   */
  createDirectory(path: string): Observable<DirectoryResponseDto> {
    return this.http.post<DirectoryResponseDto>(`${this.API_BASE}/directory`, { path });
  }

  /**
   * Delete file or directory
   */
  delete(path: string): Observable<{ path: string }> {
    return this.http.request<{ path: string }>('DELETE', `${this.API_BASE}`, { body: { path } });
  }
}
