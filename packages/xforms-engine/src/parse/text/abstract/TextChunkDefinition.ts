import type { TextChunkSource } from '../../../client/TextRange.ts';
import { DependentExpression } from '../../../expression/DependentExpression.ts';
import type { OutputChunkDefinition } from '../OutputChunkDefinition.ts';
import type { ReferenceChunkDefinition } from '../ReferenceChunkDefinition.ts';
import type { StaticTextChunkDefinition } from '../StaticTextChunkDefinition.ts';
import type { TranslationChunkDefinition } from '../TranslationChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './TextRangeDefinition.ts';

interface TextChunkDefinitionOptions {
	readonly isTranslated?: true;
}

export abstract class TextChunkDefinition<
	Source extends TextChunkSource,
> extends DependentExpression<'string'> {
	abstract readonly source: Source;
	readonly stringValue?: string;

	constructor(
		context: AnyTextRangeDefinition,
		expression: string,
		options: TextChunkDefinitionOptions = {}
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
export type AnyTextChunkDefinition =
	| OutputChunkDefinition
	| ReferenceChunkDefinition
	| StaticTextChunkDefinition
	| TranslationChunkDefinition;
