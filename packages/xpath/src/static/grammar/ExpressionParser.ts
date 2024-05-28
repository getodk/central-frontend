import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type {
	SyntaxLanguageTypeName,
	SyntaxLanguage as TreeSitterLanguage,
} from './SyntaxLanguage.ts';
import type { ASyntaxNode, UnknownSyntaxNode, XPathNode } from './SyntaxNode.ts';
import { type SyntaxTree as TreeSitterTree } from './SyntaxTree.ts';
import {
	TreeSitterXPathParser,
	type WebAssemblyResourceSpecifiers,
} from './TreeSitterXPathParser.ts';
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

export interface ParseOptions {
	readonly attemptErrorRecovery?: boolean;
}

export type BaseParser = ExpressionParser | TreeSitterXPathParser;

export class ExpressionParser {
	static from(baseParser: BaseParser): ExpressionParser {
		if (baseParser instanceof ExpressionParser) {
			return baseParser;
		}

		return new this(baseParser);
	}

	static async init(resources: WebAssemblyResourceSpecifiers): Promise<ExpressionParser> {
		const baseParser = await TreeSitterXPathParser.init(resources);

		return this.from(baseParser);
	}

	protected constructor(protected readonly xpathParser: TreeSitterXPathParser) {}

	// TODO: this cache can grow indefinitely. If the parser instance continues
	// to be used as a singleton (see `Evaluator.ts`), it would make sense to
	// have some sort of cache invalidation considerations.
	protected readonly cache = new UpsertableMap<string, SyntaxTree>();

	parse(expression: string, options: ParseOptions = {}): SyntaxTree {
		return this.cache.upsert(expression, () => {
			const parsed = this.xpathParser.parse(expression);

			const { rootNode } = parsed;

			// TODO: this is generally going to be what we want, but there may be some
			// benefit to certain kinds of error recovery. For instance, there is at
			// least one test failing because the grammar (correctly!) rejects a
			// number value with an exponent. If that's to be explicitly supported, it
			// might be more appropriate to handle it in parse error recovery than
			// with non-standard special cases in the grammar itself.
			if (rootNode.hasError) {
				if (options.attemptErrorRecovery) {
					// TODO
				}

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
