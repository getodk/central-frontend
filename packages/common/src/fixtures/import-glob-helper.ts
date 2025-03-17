import type { Awaitable } from '../../types/helpers.d.ts';
import { IS_NODE_RUNTIME } from '../env/detection.ts';

interface GlobURLFetchResponse {
	text(): Promise<string>;
}

type FetchGlobURL = (globURL: string) => Awaitable<GlobURLFetchResponse>;

let fetchGlobURL: FetchGlobURL;

if (IS_NODE_RUNTIME) {
	const { readFile } = await import('node:fs/promises');

	class NodeGlobURLFetchResponse {
		readonly fsPath: string;

		constructor(globURL: string) {
			this.fsPath = globURL.replace('/@fs/', '/');
		}

		text(): Promise<string> {
			return readFile(this.fsPath, 'utf-8');
		}
	}

	fetchGlobURL = (globURL) => {
		return new NodeGlobURLFetchResponse(globURL);
	};
} else {
	fetchGlobURL = fetch;
}

type ImportMetaGlobURLRecord = Readonly<Record<string, string>>;

export type GlobFixtureLoader = (this: void) => Promise<string>;

export interface GlobFixture {
	readonly url: URL;
	readonly load: GlobFixtureLoader;
}

export type GlobFixtureEntry = readonly [absolutePath: string, loader: GlobFixture];

const globFixtureLoader = (globURL: string): GlobFixtureLoader => {
	return async () => {
		const response = await fetchGlobURL(globURL);

		return response.text();
	};
};

export const toGlobLoaderEntries = (
	importMeta: ImportMeta,
	globObject: ImportMetaGlobURLRecord
): readonly GlobFixtureEntry[] => {
	const parentPathURL = new URL('./', importMeta.url);

	return Object.entries(globObject).map(([relativePath, value]) => {
		const { pathname: absolutePath } = new URL(relativePath, parentPathURL);
		const fixtureAssetURL = new URL(value, import.meta.url);
		const fixture: GlobFixture = {
			url: fixtureAssetURL,
			load: globFixtureLoader(value),
		};

		return [absolutePath, fixture];
	});
};
