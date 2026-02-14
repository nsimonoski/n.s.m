import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileSystemErrorMapper {
  mapFsError(error: unknown): HttpException {
    if (error instanceof Error) {
      switch ((error as NodeJS.ErrnoException).code) {
        case 'ENOENT':
          return new NotFoundException('Path not found');
        case 'EACCES':
          return new BadRequestException('Permission denied');
        case 'EEXIST':
          return new BadRequestException('Already exists');
        default:
          return new InternalServerErrorException(error.message);
      }
    }

    return new InternalServerErrorException('Unknown error');
  }
}
