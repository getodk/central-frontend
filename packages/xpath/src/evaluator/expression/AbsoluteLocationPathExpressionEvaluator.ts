import type { AbsoluteLocationPathNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathEvaluator } from './LocationPathEvaluator.ts';

export class AbsoluteLocationPathExpressionEvaluator
	extends LocationPathEvaluator
	implements ExpressionEvaluator
{
	constructor(override readonly syntaxNode: AbsoluteLocationPathNode) {
		const { text } = syntaxNode;
		const isRoot = text === '/';

		super(syntaxNode, {
			isAbsolute: true,
			isFilterExprContext: false,
			isRoot,
			isSelf: false,
		});
	}
}
