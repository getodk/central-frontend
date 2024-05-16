import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import { createMemo, type Accessor } from 'solid-js';
import type {
	TextElementChild,
	TextElementDefinition,
} from '../../../body/text/TextElementDefinition.ts';
import type { TextElementReferencePart } from '../../../body/text/TextElementReferencePart.ts';
import type { TextChunkSource } from '../../../client/TextRange.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { TextChunk } from '../../../instance/text/TextChunk.ts';
import { TextRange, type TextRole } from '../../../instance/text/TextRange.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

// prettier-ignore
type TextSources =
	| readonly [TextElementReferencePart]
	| readonly TextElementChild[];

type TextSource = CollectionValues<TextSources>;

interface TextChunkComputation {
	readonly source: TextChunkSource;
	readonly getText: Accessor<string>;
}

const createComputedTextChunk = (
	context: EvaluationContext,
	textSource: TextSource
): TextChunkComputation => {
	const { type } = textSource;

	if (type === 'static') {
		const { stringValue } = textSource;

		return {
			source: type,
			getText: () => stringValue,
		};
	}

	return context.scope.runTask(() => {
		const source: TextChunkSource = type === 'reference' ? 'itext' : type;
		const getText = createComputedExpression(context, textSource);

		return {
			source,
			getText,
		};
	});
};

const createTextChunks = (
	context: EvaluationContext,
	textSources: TextSources
): Accessor<readonly TextChunk[]> => {
	return context.scope.runTask(() => {
		const { root } = context;
		const chunkComputations = textSources.map((textSource) => {
			return createComputedTextChunk(context, textSource);
		});

		return createMemo(() => {
			return chunkComputations.map(({ source, getText }) => {
				return new TextChunk(root, source, getText());
			});
		});
	});
};

interface CreateTextRangeOptions<FallbackValue extends string | null> {
	readonly fallbackValue?: FallbackValue;
}

// prettier-ignore
type ComputedTextRange<
	Role extends TextRole,
	Definition extends TextElementDefinition<Role> | null,
	FallbackValue extends string | null
> = Accessor<
	Definition extends null
		?  FallbackValue extends null
			? TextRange<Role> | null
			: TextRange<Role>
		: TextRange<Role>
>;

// prettier-ignore
type FallbackTextRange<
	Role extends TextRole,
	FallbackValue extends string | null
> =
	FallbackValue extends null
		? TextRange<Role> | null
		: TextRange<Role>;

const createFallbackTextRange = <Role extends TextRole, FallbackValue extends string | null>(
	context: EvaluationContext,
	role: Role,
	fallbackValue: FallbackValue
): FallbackTextRange<Role, FallbackValue> => {
	if (fallbackValue == null) {
		return null as FallbackTextRange<Role, FallbackValue>;
	}

	const staticChunk = new TextChunk(context.root, 'static', fallbackValue);

	return new TextRange(role, [staticChunk]);
};

/**
 * Creates a text range (e.g. label or hint) from the provided definition,
 * reactive to:
 *
 * - The form's current language (e.g. `<label ref="jr:itext('text-id')" />`)
 * - Direct `<output>` references within the label's children
 *
 * @todo This does not yet handle itext translations **with** outputs!
 */
export const createTextRange = <
	Role extends TextRole,
	Definition extends TextElementDefinition<Role> | null,
	FallbackValue extends string | null = null,
>(
	context: EvaluationContext,
	role: Role,
	definition: Definition,
	options?: CreateTextRangeOptions<FallbackValue>
): ComputedTextRange<Role, Definition, FallbackValue> => {
	return context.scope.runTask(() => {
		if (definition == null) {
			const textRange = createFallbackTextRange(
				context,
				role,
				options?.fallbackValue ?? (null as FallbackValue)
			);
			const getTextRange = () => textRange;

			return getTextRange as ComputedTextRange<Role, Definition, FallbackValue>;
		}

		const { children, referenceExpression } = definition;

		let getTextChunks: Accessor<readonly TextChunk[]>;

		if (referenceExpression == null) {
			getTextChunks = createTextChunks(context, children);
		} else {
			getTextChunks = createTextChunks(context, [referenceExpression]);
		}

		return createMemo(() => {
			return new TextRange(role, getTextChunks());
		});
	});
};
