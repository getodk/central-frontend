import { DependentExpression } from '../../expression/DependentExpression.ts';
import type { AnyTextElementDefinition } from './TextElementDefinition.ts';
import type { TextElementOutputPart } from './TextElementOutputPart.ts';
import type { TextElementReferencePart } from './TextElementReferencePart.ts';
import type { TextElementStaticPart } from './TextElementStaticPart.ts';

export type TextElementPartType = 'output' | 'reference' | 'static';

export abstract class TextElementPart<
	Type extends TextElementPartType,
> extends DependentExpression {
	readonly stringValue?: string;

	constructor(
		readonly type: Type,
		context: AnyTextElementDefinition,
		expression: string
	) {
		super(context, expression, {
			semanticDependencies: {
				translations: type !== 'static',
			},
		});
	}
}

export type AnyTextElementPart =
	| TextElementOutputPart
	| TextElementReferencePart
	| TextElementStaticPart;
