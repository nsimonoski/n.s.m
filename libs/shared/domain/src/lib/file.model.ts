export class File {
  constructor(
    public id: string,
    public name: string,
    public path: string,
    public content: string,
    public updatedAt: Date,
  ) {}

  rename(newName: string): File {
    return new File(this.id, newName, this.path, this.content, new Date());
  }

  updateContent(newContent: string): File {
    return new File(this.id, this.name, this.path, newContent, new Date());
  }
}
