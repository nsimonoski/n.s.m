export enum Permission {
  FileRead = 'file:read',
  FileWrite = 'file:write',
  GitRead = 'git:read',
  GitWrite = 'git:write',
}

export const GUEST_PERMISSIONS = [Permission.FileRead, Permission.GitRead];
export const AUTH_PERMISSIONS = Object.values(Permission);

export interface UserProfileDto {
  username: string;
  avatarUrl: string;
  repoUrl: string | null;
  isGuest: boolean;
  permissions: Permission[];
}

export interface CloneRequestDto {
  repoUrl: string;
}

export interface WorkspaceStatusDto {
  repoUrl: string | null;
  repoName: string | null;
  rootPath: string;
  ready: boolean;
}

export interface LoginInfoDto {
  profile: UserProfileDto;
  workspace: WorkspaceStatusDto;
}
