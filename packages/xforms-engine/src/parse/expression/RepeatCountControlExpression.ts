import { RepeatElementDefinition } from '../../body/RepeatElementDefinition.ts';
import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import { DependentExpression } from '../../expression/DependentExpression.ts';
import { isConstantTruthyExpression } from '../xpath/semantic-analysis.ts';

/**
 * Represents either of these
 * {@link https://getodk.github.io/xforms-spec/#body-attributes | body attributes}:
 *
 * - `jr:count`
 * - `jr:noAddRemove`
 *
 * In both cases, the downstream effect is that the engine is responsible for
 * controlling the count of a repeat range's instances. Representing both cases
 * should simplify client usage, as well as implementation of the internal
 * representation of {@link RepeatRangeControlledNode}.
 */
export class RepeatCountControlExpression extends DependentExpression<'number'> {
	static from(
		bodyElement: RepeatElementDefinition,
		initialCount: number
	): RepeatCountControlExpression | null {
		const { countExpression, noAddRemoveExpression } = bodyElement;

		if (countExpression != null) {
			return new this(bodyElement, countExpression);
		}

		if (noAddRemoveExpression != null && isConstantTruthyExpression(noAddRemoveExpression)) {
			// Assumption: `noAddRemove` with no form-defined repeat instances has no
			// purpose. Infer intent as a single repeat instance, as defined by the
			// repeat's template.
			const fixedCountExpression = String(Math.max(initialCount, 1));

			return new this(bodyElement, fixedCountExpression);
		}

		return null;
	}

	private constructor(context: RepeatElementDefinition, expression: string) {
		super(context, 'number', expression);
	}
}
