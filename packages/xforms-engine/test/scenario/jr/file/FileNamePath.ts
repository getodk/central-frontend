import type { JavaNIOPath } from '../../java/nio/Path.ts';
import { FileSystemPath } from './FileSystemPath.ts';
import { LAST_PATH_SEGMENT_PATTERN } from './constants.ts';

/**
 * Implements **most** of the apparent intent of
 * {@link https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html#getFileName-- | `java.nio.Path#getFileName`};
 * differs in that it will throw for an empty or root path.
 */
export class FileNamePath implements JavaNIOPath {
	readonly absolutePath: FileSystemPath;
	readonly rawFileName: string;

	constructor(sourcePath: JavaNIOPath | string) {
		this.absolutePath = new FileSystemPath(sourcePath);

		const rawPath = this.absolutePath.toString();

		const rawFileNameMatches = rawPath.match(LAST_PATH_SEGMENT_PATTERN);

		if (rawFileNameMatches == null) {
			throw new Error(`Could not determine file name of path ${rawPath}`);
		}

		this.rawFileName = rawFileNameMatches[0];
	}

	getFileName(): JavaNIOPath {
		return this;
	}

	getParent(): JavaNIOPath {
		return this.absolutePath.getParent();
	}

	toAbsolutePath(): JavaNIOPath {
		return this.absolutePath;
	}

	toString(): string {
		return this.rawFileName;
	}
}
