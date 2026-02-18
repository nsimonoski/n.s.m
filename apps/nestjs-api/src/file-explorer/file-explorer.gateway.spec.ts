import { Test, TestingModule } from '@nestjs/testing';
import { FileExplorerGateway } from './file-explorer.gateway';

describe('FileExplorerGateway', () => {
  let gateway: FileExplorerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileExplorerGateway],
    }).compile();

    gateway = module.get<FileExplorerGateway>(FileExplorerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
