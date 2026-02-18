import { Test, TestingModule } from '@nestjs/testing';
import { FileExplorerController } from './file-explorer.controller';

describe('FileExplorerController', () => {
  let controller: FileExplorerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileExplorerController],
    }).compile();

    controller = module.get<FileExplorerController>(FileExplorerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
