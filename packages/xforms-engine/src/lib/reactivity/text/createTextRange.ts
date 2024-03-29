import { createMemo, type Accessor } from 'solid-js';
import type {
	TextElementChild,
	TextElementDefinition,
} from '../../../body/text/TextElementDefinition.ts';
import type { TextElementReferencePart } from '../../../body/text/TextElementReferencePart.ts';
import type { EvaluationContext } from '../../../instance/internal-api/EvaluationContext.ts';
import { OutputTextChunk } from '../../../instance/text/OutputTextChunk.ts';
import { StaticTextChunk } from '../../../instance/text/StaticTextChunk.ts';
import { TextRange, type TextRole } from '../../../instance/text/TextRange.ts';
import { TranslatedTextChunk } from '../../../instance/text/TranslatedTextChunk.ts';
import { createComputedExpression } from '../createComputedExpression.ts';

const createReferenceExpressionTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	referenceExpression: TextElementReferencePart
): Accessor<TextRange<Role>> => {
	const { root } = context;
	const computeReference = createComputedExpression(context, referenceExpression);
	const translate = createMemo(() => {
		// TODO: this should be handled in `createComputedExpression`!
		// Handled here temporarily to validate that itext translations are actually
		// reactive as expected.
		root.subscribe();

		return computeReference();
	});
	const translatedChunk = new TranslatedTextChunk(root, translate);
	const range = new TextRange(role, [translatedChunk]);

	return () => range;
};

const createMixedTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	textSources: readonly TextElementChild[]
): Accessor<TextRange<Role>> => {
	return context.scope.runTask(() => {
		const { root } = context;
		const chunks = textSources.map((textSource) => {
			const { type } = textSource;

			if (type === 'static') {
				return new StaticTextChunk(root, textSource.stringValue);
			}

			const getOutput = createComputedExpression(context, textSource);

			return new OutputTextChunk(root, getOutput);
		});

		const range = new TextRange(role, chunks);

		return () => range;
	});
};

const createStaticTextRange = <Role extends TextRole>(
	context: EvaluationContext,
	role: Role,
	fallbackValue: string
): TextRange<Role> => {
	const staticChunk = new StaticTextChunk(context.root, fallbackValue);

	return new TextRange(role, [staticChunk]);
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

	return createStaticTextRange(context, role, fallbackValue);
};

/**
 * Creates a text range (e.g. label or hint) from the provided definition,
 * reactive to:
 *
 * - The form's current language
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
			const textRange = createFallbackTextRange(context, role, options?.fallbackValue ?? null);
			const getTextRange = () => textRange;

			return getTextRange as ComputedTextRange<Role, Definition, FallbackValue>;
		}

		const { children, referenceExpression } = definition;

		if (referenceExpression != null) {
			return createReferenceExpressionTextRange(context, role, referenceExpression);
		}

		return createMixedTextRange(context, role, children);
	});
};
