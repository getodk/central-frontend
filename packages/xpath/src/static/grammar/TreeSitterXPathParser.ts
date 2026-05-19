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

const WEB_ASSEMBLY_DATA_URL_PREFIX = 'data:application/wasm;base64,';

type WebAssemblyDataURL = `${typeof WEB_ASSEMBLY_DATA_URL_PREFIX}${string}`;

const isWebAssemblyDataURL = (resource: string): resource is WebAssemblyDataURL => {
	return resource.startsWith(WEB_ASSEMBLY_DATA_URL_PREFIX);
};

const dataURLToUInt8Array = (resource: WebAssemblyDataURL): Uint8Array => {
	const base64 = resource.replace(WEB_ASSEMBLY_DATA_URL_PREFIX, '');
	const binaryChars = atob(base64);
	const mapBinaryChar = (character: string) => character.charCodeAt(0);

	return Uint8Array.from(binaryChars, mapBinaryChar);
};

const resolveWASMResource = (resource: string): Uint8Array | string => {
	if (isWebAssemblyDataURL(resource)) {
		return dataURLToUInt8Array(resource);
	}

	return unprefixNodeFileSystemPath(resource);
};

export interface WebAssemblyResourceSpecifiers {
	readonly webTreeSitter: string;
	readonly xpathLanguage: string;
}

interface WebTreeSitterInitOptions {
	/**
	 * Usage: Node, unbundled (`xpath` dev/test). Vite will have resolved the
	 * import `web-tree-sitter/tree-sitter.wasm?url` to a file system path.
	 *
	 * Providing this init option to web-tree-sitter will direct it to the
	 * WASM resource on disk.
	 */
	readonly locateFile?: () => string;

	/**
	 * Usage: Any runtime, bundled (`xpath` build -> downstream). Vite will have
	 * resolved the import `web-tree-sitter/tree-sitter.wasm?url` to its path in
	 * the file system, and then bundled the file's binary data as a `data:` URL.
	 * We cannot pass this to web-tree-sitter directly, as we do with
	 * {@link locateFile}: this must always produce a file system path.
	 *
	 * Instead, we "preload" the binary data by converting the bundled `data:`
	 * URL to a {@link Uint8Array}. Providing that binary representation as
	 * {@link wasmBinary} bypasses web-tree-sitter's file system access.
	 */
	readonly wasmBinary?: Uint8Array;
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
		const { webTreeSitter, xpathLanguage } = resources;

		let webTreeSitterInitOptions: WebTreeSitterInitOptions = {};

		if (webTreeSitter != null) {
			const webTreeSitterResource = resolveWASMResource(webTreeSitter);

			if (typeof webTreeSitterResource === 'string') {
				webTreeSitterInitOptions = {
					locateFile: () => webTreeSitterResource,
				};
			} else {
				webTreeSitterInitOptions = { wasmBinary: webTreeSitterResource };
			}
		}

		await Parser.init(webTreeSitterInitOptions);

		const xpathLanguageResource = resolveWASMResource(xpathLanguage);

		const language = await Parser.Language.load(xpathLanguageResource);

		const parser = new Parser();

		parser.setLanguage(language);

		return new this(parser);
	}

	protected constructor(protected readonly parser: Parser) {}

	parse(expression: string): WebTreeSitter.Tree {
		return this.parser.parse(expression);
	}
}
