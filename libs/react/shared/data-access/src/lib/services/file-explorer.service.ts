import axios from 'axios';
import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { apiResult, Environment } from '@org/shared/utils';

const API = `${Environment.API_BASE_URL}/file-explorer`;

export const fileExplorerService = {
  readDirectory: (path: string) =>
    apiResult(axios.post<DirectoryResponseDto>(`${API}/read`, { path }).then((r) => r.data)),

  getFile: (path: string) =>
    apiResult(
      axios
        .get<FileResponseDto>(`${API}/file`, { params: { path: encodeURIComponent(path) } })
        .then((r) => r.data),
    ),

  getFiles: (paths: string[]) =>
    apiResult(
      axios
        .post<FileResponseDto[]>(`${API}/files`, { paths: paths.map(encodeURIComponent) })
        .then((r) => r.data),
    ),

  updateFile: (file: FileResponseDto) =>
    apiResult(axios.put<FileResponseDto>(`${API}/file`, file).then((r) => r.data)),

  rename: (renameDto: RenameRequestDto) =>
    apiResult(axios.put<{ path: string }>(`${API}/rename`, renameDto).then((r) => r.data)),

  createFile: (path: string, content?: string) =>
    apiResult(
      axios.post<FileResponseDto>(`${API}/file`, { path, content }).then((r) => r.data),
    ),

  createDirectory: (path: string) =>
    apiResult(
      axios.post<DirectoryResponseDto>(`${API}/directory`, { path }).then((r) => r.data),
    ),

  searchFiles: (query: string, rootPath: string, limit = 20) =>
    apiResult(
      axios
        .get<FileResponseDto[]>(`${API}/search`, {
          params: {
            query: encodeURIComponent(query),
            path: encodeURIComponent(rootPath),
            limit: limit.toString(),
          },
        })
        .then((r) => r.data),
    ),

  delete: (path: string) =>
    apiResult(
      axios
        .request<{ path: string }>({ method: 'DELETE', url: API, data: { path } })
        .then((r) => r.data),
    ),
};
