import { IS_NODE_RUNTIME } from '../env/detection.ts';

interface GlobURLFetchResponse {
	text(): Promise<string>;
}

type Awaitable<T> = Promise<T> | T;

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

export type ImportMetaGlobLoader = (this: void) => Promise<string>;

export type GlobLoaderEntry = readonly [absolutePath: string, loader: ImportMetaGlobLoader];

const globLoader = (globURL: string): ImportMetaGlobLoader => {
	return async () => {
		const response = await fetchGlobURL(globURL);

		return response.text();
	};
};

export const toGlobLoaderEntries = (
	importMeta: ImportMeta,
	globObject: ImportMetaGlobURLRecord
): readonly GlobLoaderEntry[] => {
	const parentPathURL = new URL('./', importMeta.url);

	return Object.entries(globObject).map(([relativePath, value]) => {
		const { pathname: absolutePath } = new URL(relativePath, parentPathURL);

		return [absolutePath, globLoader(value)];
	});
};
