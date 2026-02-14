import { File } from './file.model';

export class Directory {
  constructor(
    public id: string,
    public name: string,
    public path: string,
    public files: File[] = [],
    public directories: Directory[] = []
  ) {}

  addFile(file: File): Directory {
    return new Directory(this.id, this.name, this.path, [...this.files, file], this.directories);
  }

  addDirectory(directory: Directory): Directory {
    return new Directory(this.id, this.name, this.path, this.files, [...this.directories, directory]);
  }
}
