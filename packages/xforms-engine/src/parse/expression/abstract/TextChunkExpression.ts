import type { TextChunkSource } from '../../../client/TextRange.ts';
import type { AnyTextRangeDefinition } from '../../text/abstract/TextRangeDefinition.ts';
import type { TextLiteralExpression } from '../TextLiteralExpression.ts';
import type { TextOutputExpression } from '../TextOutputExpression.ts';
import type { TextReferenceExpression } from '../TextReferenceExpression.ts';
import type { TextTranslationExpression } from '../TextTranslationExpression.ts';
import { DependentExpression } from './DependentExpression.ts';

interface TextChunkExpressionOptions {
	readonly isTranslated?: true;
}

export abstract class TextChunkExpression<
	Source extends TextChunkSource,
> extends DependentExpression<'string'> {
	abstract readonly source: Source;
	readonly stringValue?: string;

	constructor(
		context: AnyTextRangeDefinition,
		expression: string,
		options: TextChunkExpressionOptions = {}
	) {
		super(context, 'string', expression, {
			semanticDependencies: {
				translations: options.isTranslated,
			},
			ignoreContextReference: true,
		});
	}
}

// prettier-ignore
export type AnyTextChunkExpression =
	| TextLiteralExpression
	| TextOutputExpression
	| TextReferenceExpression
	| TextTranslationExpression;
