import { UpsertableMap } from '../lib/collections/UpsertableMap.ts';
import { UnreachableError } from '../lib/error/UnreachableError.ts';
import type { GlobFixtureLoader } from './import-glob-helper.ts';
import { toGlobLoaderEntries } from './import-glob-helper.ts';

/**
 * @todo Support Windows paths?
 */
const getFileName = (absolutePath: string): string => {
	const fileName = absolutePath.split('/').at(-1);

	if (fileName == null) {
		throw new Error(`Failed to get file name for file system path: ${absolutePath}`);
	}

	return fileName;
};

// prettier-ignore
const xformAttachmentFileExtensions = [
	'.csv',
	'.geojson',
	'.xml',
	'.xml.example',
	'.xlsx',
] as const;

type XFormAttachmentFileExtensions = typeof xformAttachmentFileExtensions;
type XFormAttachmentFileExtension = XFormAttachmentFileExtensions[number];

const getFileExtension = (absolutePath: string): XFormAttachmentFileExtension => {
	for (const extension of xformAttachmentFileExtensions) {
		if (absolutePath.endsWith(extension)) {
			return extension;
		}
	}

	throw new Error(`Unknown file extension for file name: ${getFileName(absolutePath)}`);
};

const getParentDirectory = (absolutePath: string): string => {
	const fileName = getFileName(absolutePath);

	return absolutePath.slice(0, absolutePath.length - fileName.length - 1);
};

const xformAttachmentFixtureLoaderEntries = toGlobLoaderEntries(
	import.meta,
	import.meta.glob<true, 'url', string>('./*/**/*', {
		query: '?url',
		import: 'default',
		eager: true,
	})
);

export class XFormAttachmentFixture {
	readonly fileName: string;
	readonly fileExtension: string;
	readonly mimeType: string;

	constructor(
		readonly absolutePath: string,
		readonly load: GlobFixtureLoader
	) {
		const fileName = getFileName(absolutePath);
		const fileExtension = getFileExtension(fileName);

		this.fileName = fileName;
		this.fileExtension = fileExtension;

		switch (fileExtension) {
			case '.csv':
				this.mimeType = 'text/csv';
				break;

			case '.geojson':
				this.mimeType = 'application/geo+json';
				break;

			case '.xml':
			case '.xml.example':
				this.mimeType = 'text/xml';
				break;

			case '.xlsx':
				this.mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
				break;

			default:
				throw new UnreachableError(fileExtension);
		}
	}
}

type XFormAttachmentFixtureEntry = readonly [absolutePath: string, fixture: XFormAttachmentFixture];

type XFormAttachmentFixtureEntries = readonly XFormAttachmentFixtureEntry[];

const xformAttachmentFixtureEntries: XFormAttachmentFixtureEntries =
	xformAttachmentFixtureLoaderEntries.map(([absolutePath, { load }]) => {
		const fixture = new XFormAttachmentFixture(absolutePath, load);

		return [absolutePath, fixture];
	});

type XFormAttachmentFixturesByAbsolutePath = ReadonlyMap<string, XFormAttachmentFixture>;

const buildXFormAttachmentFixturesByAbsolutePath = (
	entries: XFormAttachmentFixtureEntries
): XFormAttachmentFixturesByAbsolutePath => {
	return new Map(entries);
};

export const xformAttachmentFixturesByPath = buildXFormAttachmentFixturesByAbsolutePath(
	xformAttachmentFixtureEntries
);

type XFormAttachmentFixturesByDirectory = ReadonlyMap<string, readonly XFormAttachmentFixture[]>;

const buildXFormAttachmentFixturesByDirectory = (
	entries: XFormAttachmentFixtureEntries
): XFormAttachmentFixturesByDirectory => {
	const result = new UpsertableMap<string, XFormAttachmentFixture[]>();

	for (const [absolutePath, fixture] of entries) {
		const parentDirectory = getParentDirectory(absolutePath);
		const subset = result.upsert(parentDirectory, () => []);

		subset.push(fixture);
	}

	return result;
};

export const xformAttachmentFixturesByDirectory = buildXFormAttachmentFixturesByDirectory(
	xformAttachmentFixtureEntries
);
