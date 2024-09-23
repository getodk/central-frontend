import { IS_NODE_RUNTIME } from '../env/detection.ts';
import { UpsertableMap } from '../lib/collections/UpsertableMap.ts';

type XFormResourceType = 'local' | 'remote';

interface BaseXFormResourceOptions {
	readonly localPath: string | null;
	readonly identifier: string | null;
	readonly category: string | null;
}

interface LocalXFormResourceOptions extends BaseXFormResourceOptions {
	readonly localPath: string;
	readonly identifier: string;
	readonly category: string;
}

interface RemoteXFormResourceOptions extends BaseXFormResourceOptions {
	readonly category: string | null;
	readonly localPath: null;
	readonly identifier: string;
}

type XFormResourceOptions<Type extends XFormResourceType> = {
	local: LocalXFormResourceOptions;
	remote: RemoteXFormResourceOptions;
}[Type];

const SELF_URL = new URL(import.meta.url);
const PARENT_DIRECTORY_PATH = new URL('./', SELF_URL).pathname;

const ensureTrailingSlash = (pathOrPrefix: string) => {
	if (pathOrPrefix.endsWith('/')) {
		return pathOrPrefix;
	}

	return `${pathOrPrefix}/`;
};

const FIXTURE_CATEGORY_DIRECTORY_PREFIX = ensureTrailingSlash(PARENT_DIRECTORY_PATH);

const localFixtureDirectoryCategory = (localPath: string): string => {
	if (!localPath.startsWith(FIXTURE_CATEGORY_DIRECTORY_PREFIX)) {
		throw new Error(
			`Expected local path relative to module's containing directory. (Actual path: ${localPath}; containing directory: ${PARENT_DIRECTORY_PATH})`
		);
	}

	const suffix = localPath.replace(FIXTURE_CATEGORY_DIRECTORY_PREFIX, '');

	return suffix.replace(/^([^/]+)\/.*$/, '$1');
};

const pathToFileName = (localPath: string): string => {
	return localPath.replace(/^.*\/([^/]+)$/, '$1');
};

const extractURLIdentifier = (_: URL): string => {
	throw new Error('TODO!');
};

type LoadXFormXML = () => Promise<string>;

const xformURLLoader = (url: URL): LoadXFormXML => {
	return async () => {
		const response = await fetch(url);

		return response.text();
	};
};

class XFormResource<Type extends XFormResourceType> {
	static forLocalFixture(
		importerURL: string,
		relativePath: string,
		localURL: URL | string,
		loadXML?: LoadXFormXML
	): XFormResource<'local'> {
		const resourceURL = new URL(localURL, importerURL);
		const localPath = new URL(relativePath, importerURL).pathname;

		return new XFormResource('local', resourceURL, loadXML ?? xformURLLoader(resourceURL), {
			category: localFixtureDirectoryCategory(localPath),
			localPath,
			identifier: pathToFileName(localPath),
		});
	}

	static fromRemoteURL(
		remoteURL: URL | string,
		options?: Partial<XFormResourceOptions<'remote'>>
	): XFormResource<'remote'> {
		const resourceURL = new URL(remoteURL);
		const loadXML = xformURLLoader(resourceURL);

		return new XFormResource('remote', resourceURL, loadXML, {
			category: options?.category ?? 'other',
			identifier: options?.identifier ?? extractURLIdentifier(resourceURL),
			localPath: options?.localPath ?? null,
		});
	}

	readonly category: string;
	readonly localPath: XFormResourceOptions<Type>['localPath'];
	readonly identifier: XFormResourceOptions<Type>['identifier'];

	private constructor(
		readonly resourceType: Type,
		readonly resourceURL: URL,
		readonly loadXML: LoadXFormXML,
		options: XFormResourceOptions<Type>
	) {
		this.category = options.category ?? 'other';
		this.localPath = options.localPath;
		this.identifier = options.identifier;
	}
}

export type XFormFixture = XFormResource<'local'>;

const buildXFormFixtures = (): readonly XFormFixture[] => {
	if (IS_NODE_RUNTIME) {
		const fixtureXMLByRelativePath = import.meta.glob<false, 'raw', string>('./**/*.xml', {
			query: '?raw',
			import: 'default',
			eager: false,
		});

		return Object.entries(fixtureXMLByRelativePath).map(([path, loadXML]) => {
			const localURL = new URL(path, import.meta.url);
			const fixture = XFormResource.forLocalFixture(import.meta.url, path, localURL, loadXML);

			return fixture;
		});
	}

	const fixtureURLByRelativePath = import.meta.glob<true, 'url', string>('./**/*.xml', {
		query: '?url',
		import: 'default',
		eager: true,
	});

	return Object.entries(fixtureURLByRelativePath).map(([path, url]) => {
		const fixture = XFormResource.forLocalFixture(import.meta.url, path, url);

		return fixture;
	});
};

export const xformFixturesByRelativePath = buildXFormFixtures();

export const xformFixtures = Array.from(xformFixturesByRelativePath.values());

export const xformFixturesByCategory: ReadonlyMap<string, readonly XFormFixture[]> =
	xformFixtures.reduce((acc, fixture) => {
		const fixtures = acc.upsert(fixture.category, () => []);

		fixtures.push(fixture);

		return acc;
	}, new UpsertableMap<string, XFormFixture[]>());

export const xformFixturesByIdentifier: ReadonlyMap<string, XFormFixture> = xformFixtures.reduce(
	(acc, fixture) => {
		const { identifier } = fixture;

		if (acc.has(identifier)) {
			throw new Error(`Multiple fixtures with identifier: ${identifier}`);
		}

		acc.set(identifier, fixture);

		return acc;
	},
	new Map()
);
