import { IS_NODE_RUNTIME } from '@getodk/common/env/detection.ts';

export type FileSeparator = '/' | '\\';

/**
 * @todo This detection should likely be done in vitest.config.ts and populated
 * with a `define` config.
 */
export const FILE_SEPARATOR: FileSeparator = await (async () => {
	let result: FileSeparator | null = null;

	if (IS_NODE_RUNTIME) {
		try {
			const { sep } = await import('node:path');

			result = sep;
		} catch {
			// This will fail in non-Node environments, without module `node:*` module
			// stubs (which Vitest may provide automatically)
		}
	}

	if (result == null) {
		result = '/';
	}

	return result;
})();

export const FILE_SEPARATOR_SUBPATTERN: string =
	FILE_SEPARATOR === '/' ? FILE_SEPARATOR : `\\${FILE_SEPARATOR}`;

export const LAST_PATH_SEGMENT_PATTERN = new RegExp(
	`${FILE_SEPARATOR_SUBPATTERN}?[^${FILE_SEPARATOR}]+$`
);
