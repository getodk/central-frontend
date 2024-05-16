import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import type { FunctionCallNode } from '../../static/grammar/SyntaxNode.ts';
import type { ExpressionEvaluator } from './ExpressionEvaluator.ts';
import { createExpression } from './factory.ts';

interface FunctionCallName {
	readonly prefix: string | null;
	readonly localName: string;
}

const functionCallName = (syntaxNode: FunctionCallNode): FunctionCallName => {
	const [nameNode] = syntaxNode.children[0].children;

	switch (nameNode.type) {
		case 'prefixed_name': {
			const [prefixNode, localNameNode] = nameNode.children;

			return {
				prefix: prefixNode.text,
				localName: localNameNode.text,
			};
		}

		case 'unprefixed_name':
			return {
				prefix: null,
				localName: nameNode.text,
			};

		default:
			throw new UnreachableError(nameNode);
	}
};

export class FunctionCallExpressionEvaluator implements ExpressionEvaluator {
	readonly name: FunctionCallName;
	readonly argumentExpressions: readonly ExpressionEvaluator[];

	constructor(readonly syntaxNode: FunctionCallNode) {
		const [, ...argumentNodes] = syntaxNode.children;

		this.name = functionCallName(syntaxNode);

		this.argumentExpressions = argumentNodes.map((argumentNode) => {
			return createExpression(argumentNode);
		});
	}

	evaluate(context: EvaluationContext): Evaluation {
		const { argumentExpressions, name } = this;
		const { functions } = context;
		const functionImplementation = functions.getImplementation(context, name);

		if (functionImplementation == null) {
			const { prefix, localName } = name;
			const errorName = prefix == null ? localName : `${prefix}:${localName}`;

			throw `todo function not defined: ${errorName}`;
		}

		return functionImplementation.call(context.currentContext(), argumentExpressions);
	}
}
