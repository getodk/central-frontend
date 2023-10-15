// import * as Parser from 'web-tree-sitter';
import type { Language, ParserInstance } from '../../../vendor/web-tree-sitter.ts';
import { Parser } from '../../../vendor/web-tree-sitter.ts';
// TODO: ?raw (?)
import treeSitterWASM from 'web-tree-sitter/tree-sitter.wasm?url';
import treeSitterXPathWASM from 'tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import { UpsertableMap } from '../../lib/collections/UpsertableMap.ts';
import type {
	SyntaxLanguageTypeName,
	SyntaxLanguage as TreeSitterLanguage,
} from './SyntaxLanguage.ts';
import type { ASyntaxNode, UnknownSyntaxNode, XPathNode } from './SyntaxNode.ts';
import { type SyntaxTree as TreeSitterTree } from './SyntaxTree.ts';
import type { AnySyntaxType } from './type-names.ts';

class SyntaxNode implements ASyntaxNode {
	readonly type: AnySyntaxType;

	readonly text: string;
	readonly childCount: number;
	readonly children: readonly SyntaxNode[];

	constructor(node: ASyntaxNode) {
		const {
			type,

			text,
			childCount,
			children,
		} = node;

		this.type = type;
		this.text = text;
		this.childCount = childCount;
		this.children = children.map((child) => new SyntaxNode(child));
	}

	child(index: number): SyntaxNode | null {
		return this.children[index] ?? null;
	}
}

class SyntaxLanguage implements TreeSitterLanguage {
	readonly types: readonly SyntaxLanguageTypeName[];

	constructor(tsLanguage: TreeSitterLanguage) {
		this.types = [...tsLanguage.types].filter((type) => type != null);
	}
}

class SyntaxTree implements TreeSitterTree {
	readonly language: SyntaxLanguage;
	readonly rootNode: XPathNode;

	constructor(tsTree: TreeSitterTree) {
		const { language, rootNode } = tsTree;

		this.language = new SyntaxLanguage(language);
		this.rootNode = new SyntaxNode(rootNode as UnknownSyntaxNode) as XPathNode;
	}
}

interface WASMPaths {
	readonly ABSOLUTE: {
		readonly TREE_SITTER: string;
		readonly TREE_SITTER_XPATH: string;
	};
}

declare global {
	// eslint-disable-next-line no-var -- this is how you declare globals!
	var RUNTIME_TARGET: 'NODE' | 'WEB';

	// eslint-disable-next-line no-var -- this is how you declare globals!
	var WASM_PATHS: WASMPaths;
}

if (typeof RUNTIME_TARGET !== 'string') {
	throw new Error(
		'Could not determine runtime target. Build with a `RUNTIME_TARGET` global defined to either "NODE" or "WEB".'
	);
}

const IS_WEB = RUNTIME_TARGET === 'WEB';

const initTreeSitterParser = async (): Promise<ParserInstance> => {
	if (IS_WEB) {
		// Web runtime, WASM location determined by Vite import with `?url`
		try {
			await Parser.init({
				locateFile: () => treeSitterWASM,
			});

			return new Parser();
		} catch {}
	}

	// Node runtime: note we currently load WASM even in Node. If performance
	// becomes a concern we may look into using the Node/N-API tree-sitter
	// bindings. The downside is there are several annoying differences in the
	// Node `tree-sitter` API.
	//
	// First try implicit path, determined by web-tree-sitter itself.
	try {
		await Parser.init();

		// Fall back to explicit absolute path, determined in Vite config.
	} catch (error) {
		const { TREE_SITTER } = WASM_PATHS?.ABSOLUTE ?? {};

		if (TREE_SITTER == null) {
			throw error;
		}

		await Parser.init({
			locateFile: () => TREE_SITTER,
		});
	}

	return new Parser();
};

const loadXPathLanguage = async (): Promise<Language> => {
	let language!: Language;

	if (IS_WEB) {
		// Web runtime, WASM location determined by Vite import with `?url`
		try {
			language = await Parser.Language.load(treeSitterXPathWASM);
		} catch {}
	}

	if (language != null) {
		return language;
	}

	// Node runtime, see note in `initTreeSitterParser`.
	//
	// First try package path, relying on Node module resolution.
	try {
		language = await Parser.Language.load('tree-sitter-xpath/tree-sitter-xpath.wasm');

		// Fall back to explicit absolute path, determined in Vite config.
	} catch (error) {
		const { TREE_SITTER_XPATH } = WASM_PATHS?.ABSOLUTE ?? {};

		if (TREE_SITTER_XPATH == null) {
			throw error;
		}

		language = await Parser.Language.load(TREE_SITTER_XPATH);
	}

	if (language == null) {
		throw new Error('Failed to load tree-sitter-xpath');
	}

	return language;
};

const parser = await initTreeSitterParser();
const XPath = await loadXPathLanguage();

parser.setLanguage(XPath);

export class ExpressionParser {
	// TODO: this cache can grow indefinitely. If the parser instance continues
	// to be used as a singleton (see `Evaluator.ts`), it would make sense to
	// have some sort of cache invalidation considerations.
	protected readonly cache = new UpsertableMap<string, SyntaxTree>();

	parse(expression: string): SyntaxTree {
		return this.cache.upsert(expression, () => {
			const parsed = parser.parse(expression);

			const { rootNode } = parsed;

			// TODO: this is generally going to be what we want, but there may be some
			// benefit to certain kinds of error recovery. For instance, there is at
			// least one test failing because the grammar (correctly!) rejects a
			// number value with an exponent. If that's to be explicitly supported, it
			// might be more appropriate to handle it in parse error recovery than
			// with non-standard special cases in the grammar itself.
			if (rootNode.hasError()) {
				throw new Error(`Expression has syntax error: ${expression}`);
			}

			// @ts-expect-error - the parser needs more reasonable types!
			return new SyntaxTree(parsed as TreeSitterTree);
		});
	}

	[Symbol.dispose]() {
		this.cache.clear();
	}
}
