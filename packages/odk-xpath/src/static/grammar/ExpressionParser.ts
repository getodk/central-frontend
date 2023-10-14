import { type Tree as WebTreeSitterTree } from 'web-tree-sitter';
import * as Parser from 'web-tree-sitter';
import { UpsertableMap } from '../../lib/collections/UpsertableMap.ts';
import type {
  SyntaxLanguageTypeName,
  SyntaxLanguage as TreeSitterLanguage,
} from './SyntaxLanguage.ts';
import type {
  ASyntaxNode,
  UnknownSyntaxNode,
  XPathNode,
} from './SyntaxNode.ts';
import {
  type SyntaxTree as TreeSitterTree,
} from './SyntaxTree.ts';
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

await Parser.init({
	locateFile(scriptName: string) {
		if (scriptName === 'tree-sitter.wasm') {
			return TREE_SITTER_WASM_URL;
		}

		if (scriptName === 'tree-sitter-xpath.wasm') {
			return TREE_SITTER_XPATH_WASM_URL;
		}
	}
});

const parser = new Parser();

const XPath = await Parser.Language.load(TREE_SITTER_XPATH_WASM_URL);

parser.setLanguage(XPath);

export class ExpressionParser {
  // TODO: this cache can grow indefinitely. If the parser instance continues
  // to be used as a singleton (see `Evaluator.ts`), it would make sense to
  // have some sort of cache invalidation considerations.
  protected readonly cache = new UpsertableMap<string, SyntaxTree>();

  parse(expression: string): SyntaxTree {
    return this.cache.upsert(expression, () => {
      const parsed = parser.parse(expression);

      const { rootNode } = (parsed as WebTreeSitterTree);

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
