import type { RelativeLocationPathNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { LocationPathEvaluator } from './LocationPathEvaluator.ts';

export class RelativeLocationPathExpressionEvaluator
	extends LocationPathEvaluator
	implements ExpressionEvaluator
{
	constructor(override readonly syntaxNode: RelativeLocationPathNode) {
		const { text } = syntaxNode;
		const isSelf = text === '.';

		super(syntaxNode, {
			isAbsolute: false,
			isFilterExprContext: false,
			isRoot: false,
			isSelf,
		});
	}
}
