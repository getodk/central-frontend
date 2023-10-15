import type { SyntaxLanguage } from './SyntaxLanguage.ts';
import type { XPathNode } from './SyntaxNode.ts';

export interface SyntaxTree {
	readonly language: SyntaxLanguage;
	readonly rootNode: XPathNode;
}
