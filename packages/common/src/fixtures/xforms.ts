import { JRResourceService } from '../jr-resources/JRResourceService.ts';
import type { JRResourceURL } from '../jr-resources/JRResourceURL.ts';
import { UpsertableMap } from '../lib/collections/UpsertableMap.ts';
import { toGlobLoaderEntries } from './import-glob-helper.ts';

type XFormResourceType = 'local' | 'remote';

type ResourceServiceFactory = () => JRResourceService;

interface BaseXFormResourceOptions {
	readonly localPath: string | null;
	readonly identifier: string | null;
	readonly category: string | null;
	readonly initializeFormAttachmentService?: ResourceServiceFactory;
}

interface LocalXFormResourceOptions extends BaseXFormResourceOptions {
	readonly localPath: string;
	readonly identifier: string;
	readonly category: string;
	readonly initializeFormAttachmentService: ResourceServiceFactory;
}

interface RemoteXFormResourceOptions extends BaseXFormResourceOptions {
	readonly category: string | null;
	readonly localPath: null;
	readonly identifier: string;

	/**
	 * @todo Note that {@link RemoteXFormResourceOptions} corresponds to an API
	 * primarily serving
	 * {@link https://getodk.org/web-forms-preview/ | Web Forms Preview}
	 * functionality. In theory, we could allow a mechanism to support form
	 * attachments in for that use case, but we'd need to design for it. Until
	 * then, it doesn't make a whole lot of sense to accept arbitrary IO here.
	 */
	readonly initializeFormAttachmentService?: never;
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

const extractURLIdentifier = (remoteUrl: URL): string => {
	const match = /\/([^/]+\/[^/]+)\.[^/]+$/.exec(remoteUrl.pathname);

	return match?.[1] ?? '';
};

type LoadXFormXML = () => Promise<string>;

const xformURLLoader = (url: URL): LoadXFormXML => {
	return async () => {
		const response = await fetch(url);

		return response.text();
	};
};

const getNoopResourceService: ResourceServiceFactory = () => {
	return new JRResourceService();
};

export class XFormResource<Type extends XFormResourceType> {
	static forLocalFixture(
		localPath: string,
		resourceURL: URL,
		loadXML?: LoadXFormXML
	): XFormResource<'local'> {
		return new XFormResource('local', resourceURL, loadXML ?? xformURLLoader(resourceURL), {
			category: localFixtureDirectoryCategory(localPath),
			localPath,
			identifier: pathToFileName(localPath),
			initializeFormAttachmentService: () => {
				const service = new JRResourceService();
				const parentPath = localPath.replace(/\/[^/]+$/, '');

				service.activateFixtures(parentPath, ['file', 'file-csv']);

				return service;
			},
		});
	}

	static fromRemoteURL(
		remoteURL: URL | string,
		options?: Partial<XFormResourceOptions<'remote'>>
	): XFormResource<'remote'> {
		const resourceURL = new URL(remoteURL);
		const loadXML = xformURLLoader(resourceURL);

		return new XFormResource('remote', resourceURL, loadXML, {
			...options,

			category: options?.category ?? 'other',
			identifier: options?.identifier ?? extractURLIdentifier(resourceURL),
			localPath: options?.localPath ?? null,
		});
	}

	readonly category: string;
	readonly localPath: XFormResourceOptions<Type>['localPath'];
	readonly identifier: XFormResourceOptions<Type>['identifier'];
	readonly fetchFormAttachment: (url: JRResourceURL) => Promise<Response>;

	private constructor(
		readonly resourceType: Type,
		readonly resourceURL: URL,
		readonly loadXML: LoadXFormXML,
		options: XFormResourceOptions<Type>
	) {
		this.category = options.category ?? 'other';
		this.localPath = options.localPath;
		this.identifier = options.identifier;

		const initializeFormAttachmentService =
			options.initializeFormAttachmentService ?? getNoopResourceService;

		let resourceService: JRResourceService | null = null;

		this.fetchFormAttachment = (url) => {
			resourceService = resourceService ?? initializeFormAttachmentService();

			return resourceService.handleRequest(url);
		};
	}
}

const xformFixtureLoaderEntries = toGlobLoaderEntries(
	import.meta,
	import.meta.glob<true, 'url', string>('./**/*.xml', {
		query: '?url',
		import: 'default',
		eager: true,
	})
);

export type XFormFixture = XFormResource<'local'>;

const buildXFormFixtures = (): readonly XFormFixture[] => {
	return xformFixtureLoaderEntries.map(([path, loadXML]) => {
		const resourceURL = new URL(path, SELF_URL);

		return XFormResource.forLocalFixture(path, resourceURL, loadXML);
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
