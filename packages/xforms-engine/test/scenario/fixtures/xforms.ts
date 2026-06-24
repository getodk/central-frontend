import { JRResourceService } from './JRResourceService.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap';
import type { GlobFixture } from './import-glob-helper.ts';
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
  readonly initializeFormAttachmentService?: ResourceServiceFactory;
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

type LoadXFormXML = () => Promise<Blob | string>;

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
  static forLocalFixture(localPath: string, fixture: GlobFixture): XFormResource<'local'> {
    return new XFormResource('local', fixture.url, fixture.load, {
      category: localFixtureDirectoryCategory(localPath),
      localPath,
      identifier: pathToFileName(localPath),
      initializeFormAttachmentService: () => {
        const service = new JRResourceService();
        const parentPath = localPath.replace(/\/[^/]+$/, '');

        service.activateFixtures(parentPath, ['file', 'file-csv', 'images', 'audio', 'video']);

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
    const attachmentService = () => {
      const service = new JRResourceService();
      const parentPath = resourceURL.pathname.replace(/\/[^/]+$/, '');

      service.activateFixtures(parentPath, ['file', 'file-csv', 'images', 'audio', 'video']);

      return service;
    };

    return new XFormResource('remote', resourceURL, loadXML, {
      ...options,

      category: options?.category ?? 'other',
      identifier: options?.identifier ?? extractURLIdentifier(resourceURL),
      localPath: options?.localPath ?? null,
      initializeFormAttachmentService:
        options?.initializeFormAttachmentService ?? attachmentService,
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
  import.meta.glob<true, 'url', string>('./**/*.xxml', {
    query: '?url',
    import: 'default',
    eager: true,
  })
);

export type XFormFixture = XFormResource<'local'>;

const buildXFormFixtures = (): readonly XFormFixture[] => {
  return xformFixtureLoaderEntries.map(([path, fixture]) => {
    return XFormResource.forLocalFixture(path, fixture);
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
