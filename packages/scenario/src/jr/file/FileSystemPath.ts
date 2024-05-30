import type { JavaNIOPath } from '../../java/nio/Path.ts';
import { FileNamePath } from './FileNamePath.ts';
import { LAST_PATH_SEGMENT_PATTERN } from './constants.ts';

export class FileSystemPath implements JavaNIOPath {
	readonly rawPath: string;

	constructor(readonly path: JavaNIOPath | string) {
		if (typeof path === 'string') {
			this.rawPath = path;
		} else {
			this.rawPath = path.toAbsolutePath().toString();
		}
	}

	getFileName(): JavaNIOPath {
		return new FileNamePath(this);
	}

	getParent(): JavaNIOPath {
		return new FileSystemPath(this.rawPath.replace(LAST_PATH_SEGMENT_PATTERN, ''));
	}

	toAbsolutePath(): JavaNIOPath {
		return this;
	}

	toString(): string {
		return this.rawPath;
	}
}
