import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UserProfileDto } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';
import { apiResult, ApiResult } from '@org/angular-utils';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/auth`;

  constructor(private readonly http: HttpClient) {}

  getLoginInfo(): Observable<ApiResult<UserProfileDto | null>> {
    return this.http
      .get<UserProfileDto | null>(`${this.API_BASE}/login-info`)
      .pipe(apiResult());
  }

  guestLogin(): Observable<ApiResult<UserProfileDto>> {
    return this.http.get<UserProfileDto>(`${this.API_BASE}/guest`).pipe(apiResult());
  }

  logout(): Observable<ApiResult<void>> {
    return this.http.post<void>(`${this.API_BASE}/logout`, {}).pipe(apiResult());
  }

  getGithubAuthUrl(): string {
    return `${Environment.API_BASE_URL}/auth/github?app=angular`;
  }
}
