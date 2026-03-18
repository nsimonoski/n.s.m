import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UserProfileDto } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/auth`;

  constructor(private readonly http: HttpClient) {}

  getLoginInfo(): Observable<UserProfileDto | null> {
    return this.http.get<UserProfileDto | null>(`${this.API_BASE}/login-info`);
  }

  guestLogin(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.API_BASE}/guest`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_BASE}/logout`, {});
  }

  getGithubAuthUrl(): string {
    return `${Environment.API_BASE_URL}/auth/github?app=angular`;
  }
}
