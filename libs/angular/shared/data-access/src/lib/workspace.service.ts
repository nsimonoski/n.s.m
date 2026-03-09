import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/workspace`;

  constructor(private readonly http: HttpClient) {}

  cloneRepo(repoUrl: string): Observable<WorkspaceStatusDto> {
    return this.http.post<WorkspaceStatusDto>(`${this.API_BASE}/clone`, { repoUrl });
  }
}
