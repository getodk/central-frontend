import { IS_NODE_RUNTIME } from '@getodk/common/env/detection.ts';
import WebTreeSitter, * as WebTreeSitterNamespace from 'web-tree-sitter';

type ParserConstructor = typeof WebTreeSitter;
type Parser = InstanceType<ParserConstructor>;

let Parser: ParserConstructor;

// Ah, the fun of dealing with mixed ESM/CJS and build tools which address it
// inconsistently! Each case is commented for the current conditions which
// necessitates it.

if (
	// Node/Vitest (jsdom) requires a namespace import, and access to a `default`
	// property on the imported namespace object.
	typeof WebTreeSitterNamespace.default === 'function'
) {
	Parser = WebTreeSitterNamespace.default;
} else if (
	// Vite build and Vitest (browser test environments) require a namespace
	// import, to which the constructor is assigned.
	typeof WebTreeSitterNamespace === 'function'
) {
	Parser = WebTreeSitterNamespace;
} else if (
	// No known cases, added out of an abundance of caution since the ESM default
	// is already imported for its type definitions.
	typeof WebTreeSitter === 'function'
) {
	Parser = WebTreeSitter;
} else {
	throw new Error('Failed to import web-tree-sitter (`Parser` constructor)');
}

/**
 * Vitest `?url` imports produce `/@fs/Absolute/file-system/paths`, which
 * tree-sitter will fail to load in Node, because it uses `node:fs` functions
 * to access the file system there.
 */
const unprefixNodeFileSystemPath = (resourcePath: string) => {
	if (IS_NODE_RUNTIME && resourcePath.startsWith('/@fs/')) {
		return resourcePath.replace('/@fs/', '/');
	}

	return resourcePath;
};

type ResourceType = 'binary' | 'locator';

type ResolvedResourceType<T extends ResourceType> = T extends 'binary' ? Uint8Array : string;

class ResourceResolutionError extends Error {
	constructor(resource: string, resourceType: ResourceType) {
		// Prevent spewing enormous `data:` URLs in error logging
		const truncatedResource = resource.substring(0, 100);
		const message = `Could not resolve resource to type ${resourceType}: ${truncatedResource}`;

		super(message);
	}
}

const WEB_ASSEMBLY_DATA_URL_PREFIX = 'data:application/wasm;base64,';

/**
 * Node-specific: convert a `data:` URL resource to binary data. This will be
 * encountered when `@getodk/xpath` is built/bundled, and downstream packages
 * (like `@getodk/xforms-engine` and its clients) initialize a tree-sitter
 * {@link Parser}.
 */
const resolveWebAssemblyDataURL = (resource: string): Uint8Array | null => {
	const base64 = resource.replace(WEB_ASSEMBLY_DATA_URL_PREFIX, '');

	if (base64 === resource) {
		throw new ResourceResolutionError(resource, 'binary');
	}

	// Node's `Buffer` is supposed to be a Uint8Array. web-tree-sitter disagrees!
	const buffer = Buffer.from(base64, 'base64');
	const u8a = new Uint8Array(buffer);

	return u8a;
};

/**
 * Resolves tree-sitter and @getodk/tree-sitter-xpath WASM resources in all
 * supported environments. The following cases are handled:
 *
 * - web-tree-sitter `Parser.init` expects its WASM resource to be specified by
 *   URL in a web environment, but it expects a file system path in a Node
 *   environment.
 *
 * - web-tree-sitter `Parser.Language.load` accepts a URL in either environment,
 *   but large `data:` URLs may fail to load without first converting them to a
 *   shorter `blob:` URL.
 *
 * Where:
 *
 * - `resource` is a URL (likely a path relative to the server host), as
 *   provided by Vite in an import like `package-name/file-name.wasm?url`
 *   (typically `@getodk/xpath` test mode)
 *
 * - `resource` is a `data:` URL which may be provided by a bundled build, which
 *   in turn is:
 *
 *     - Converted to a `Uint8Array` (Node)
 *     - pre-fetched and stored as a `blob:` object URL for fetching the
 *       @getodk/tree-sitter-xpath language WASM asset (Browser)
 *
 * - `resource` is an arbitrary URL, as provided by a downstream user of
 *   @getodk/xpath as a library.
 */
const resolveWebAssemblyResource = async <T extends ResourceType>(
	resource: string,
	resourceType: T
): Promise<ResolvedResourceType<T>> => {
	if (IS_NODE_RUNTIME && resourceType === 'binary' && resource.startsWith('data:')) {
		const binary = resolveWebAssemblyDataURL(resource);

		if (binary != null) {
			return binary as ResolvedResourceType<T>;
		}
	}

	const baseResult = unprefixNodeFileSystemPath(resource);

	if (resourceType === 'locator' && !baseResult.startsWith('data:')) {
		return baseResult as ResolvedResourceType<T>;
	}

	// This generally won't be supported in Node downstream
	if (typeof URL.createObjectURL !== 'function') {
		if (resourceType === 'locator') {
			return baseResult as ResolvedResourceType<T>;
		}

		throw new ResourceResolutionError(resource, resourceType);
	}

	const response = await fetch(resource);

	if (resourceType === 'binary') {
		const data = await response.arrayBuffer();

		return new Uint8Array(data) as ResolvedResourceType<T>;
	}

	const blob = await response.blob();

	return URL.createObjectURL(blob) as ResolvedResourceType<T>;
};

export interface WebAssemblyResourceSpecifiers {
	readonly webTreeSitter: string;
	readonly xpathLanguage: string;
}

interface WebTreeSitterInitOptions {
	readonly locateFile?: () => string;
}

/**
 * `TreeSitterXPathParser` is a separate entry provided by @getodk/xpath as a
 * simpler means to handle various conditions where the tree-sitter and
 * @getodk/tree-sitter-xpath WASM resources need to be loaded before we can
 * begin parsing XPath expressions.
 *
 * Note: Loading these resources is (for now) inherently asynchronous, as they
 * are expected to be loaded with either file system or network calls. This has
 * two consequences:
 *
 * 1. The `TreeSitterXPathParser` constructor cannot be called directly, because
 *    class constructors must be synchronous. As such, it is marked `protected`
 *    here, with the public interface being the static, async `init` method.
 *
 * 2. While the `init` call itself can happen in any context suited to handle
 *    its returned Promise, likely use cases (such as our own) will need to
 *    perform this async initialization upfront before (otherwise synchronous)
 *    XPath evaluation may proceed. This is more or less a solved problem for
 *    e.g. @getodk/xforms-engine, which uses ESM in environments supporting
 *    top-level `await`. But it will require extra consideration in environments
 *    which currently initialize synchronously (such as enketo-core, should we
 *    want to adopt this evaluator there).
 */
export class TreeSitterXPathParser {
	static async init(resources: WebAssemblyResourceSpecifiers): Promise<TreeSitterXPathParser> {
		const { webTreeSitter: webTreeSitterResource, xpathLanguage: xpathLanguageResource } =
			resources;

		let webTreeSitterInitOptions: WebTreeSitterInitOptions = {};

		if (webTreeSitterResource != null) {
			const webTreeSitterLocator = await resolveWebAssemblyResource(
				webTreeSitterResource,
				'locator'
			);

			webTreeSitterInitOptions = {
				locateFile: () => webTreeSitterLocator,
			};
		}

		let xpathLanguageResourceType: ResourceType;

		if (IS_NODE_RUNTIME && !xpathLanguageResource.startsWith('data:')) {
			xpathLanguageResourceType = 'locator';
		} else {
			xpathLanguageResourceType = 'binary';
		}

		const xpathLanguageBinary = await resolveWebAssemblyResource(
			xpathLanguageResource,
			xpathLanguageResourceType
		);

		await Parser.init(webTreeSitterInitOptions);

		const language = await Parser.Language.load(xpathLanguageBinary);

		const parser = new Parser();

		parser.setLanguage(language);

		return new this(parser);
	}

	protected constructor(protected readonly parser: Parser) {}

	parse(expression: string): WebTreeSitter.Tree {
		return this.parser.parse(expression);
	}
}
