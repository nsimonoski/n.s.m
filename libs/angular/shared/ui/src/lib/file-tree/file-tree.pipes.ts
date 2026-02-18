import { Pipe, PipeTransform } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { NodeAction } from './node/action/file-tree-node-action.component';

export type NodeActionsFn = (node: DirectoryResponseDto | FileResponseDto) => NodeAction[];

@Pipe({ name: 'fileIcon', standalone: true, pure: true })
export class FileIconPipe implements PipeTransform {
  transform(node: DirectoryResponseDto | FileResponseDto, expanded: boolean): FileUtils.FileIconConfig {
    return FileUtils.getFileIcon(node.type, expanded);
  }
}

@Pipe({ name: 'expandIcon', standalone: true, pure: true })
export class ExpandIconPipe implements PipeTransform {
  transform(expanded: boolean): string {
    return 'codicon ' + FileUtils.getExpandIcon(expanded);
  }
}

@Pipe({ name: 'indentGuides', standalone: true, pure: true })
export class IndentGuidesPipe implements PipeTransform {
  transform(level: number): number[] {
    return Array(level).fill(0);
  }
}

@Pipe({ name: 'fileChildren', standalone: true, pure: true })
export class FileChildrenPipe implements PipeTransform {
  transform(node: DirectoryResponseDto | FileResponseDto): (DirectoryResponseDto | FileResponseDto)[] {
    if (node.type !== Enums.FileType.DIRECTORY) return [];
    const dir = node as DirectoryResponseDto;
    return [...dir.directories, ...dir.files];
  }
}

@Pipe({ name: 'nodeActions', standalone: true, pure: true })
export class NodeActionsPipe implements PipeTransform {
  transform(node: DirectoryResponseDto | FileResponseDto, fn: NodeActionsFn | null): NodeAction[] {
    return fn ? fn(node) : [];
  }
}
