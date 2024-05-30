import { ComparableChoice } from './ComparableChoice.ts';

const LABEL_EQUALITY_NOT_APPLICABLE = Symbol('LABEL_EQUALITY_NOT_APPLICABLE');
type LabelEqualityNotApplicable = typeof LABEL_EQUALITY_NOT_APPLICABLE;

/**
 * This type was chosen mainly to minimize cognitive overhead in determining the
 * {@link ComparableChoiceEqualityExpectationResult.pass} value. Specifically,
 * it will allow that value to be true if each individual property comparison's
 * result is **truthy**.
 *
 * @see {@link ComparableChoiceEqualityExpectationResult} (and its properties)
 * for additional commentary.
 */
type IsLabelEqual = LabelEqualityNotApplicable | boolean;

/**
 * @todo This could also be expressed as an enum-like value, but attempting to
 * give it a coherent name and set of possible values didn't feel like a
 * particularly valuable use of time. Happy to reconsider!
 */
export interface ComparableChoiceEqualityExpectationResult {
	/**
	 * Passes if:
	 *
	 * - {@link isValueEqual} is `true`
	 *
	 * - {@link isLabelEqual} is either:
	 *    - `true`
	 *    - {@link LabelEqualityNotApplicable}
	 *
	 * @see {@link isLabelEqual}
	 */
	readonly pass: boolean;

	/**
	 * Will be:
	 *
	 * - `true` if both:
	 *    - {@link ExpectedChoice.label} is a string
	 *    - The compared ("actual") {@link ComparableChoice.label} has the same
	 *      string value
	 *
	 * - `false` if both:
	 *    - {@link ExpectedChoice.label} is a string
	 *    - The compared ("actual") {@link ComparableChoice.label} is null or has
	 *      a different string value
	 *
	 * - {@link LabelEqualityNotApplicable} if no label is expressed in the
	 *   calling assertion (i.e. {@link ExpectedChoice.label} is `null`)
	 *
	 * @todo This would probably be better expressed as an enum-like value; notes
	 * on the {@link ComparableChoiceEqualityExpectationResult} containing
	 * interface apply.
	 */
	readonly isLabelEqual: IsLabelEqual;
	readonly isValueEqual: boolean;
}

export class ExpectedChoice extends ComparableChoice {
	get label(): string | null {
		return this.labelOrId;
	}

	constructor(
		readonly value: string,
		protected readonly labelOrId: string | null = null
	) {
		super();
	}

	/**
	 * @todo It may be appropriate to express this as an `equals` method with a
	 * boolean return value. We may even want a more general `equals` method on a
	 * more general `Comparable` interface. However, that type of interface is
	 * often expected to be consistent with general concepts and constraints of
	 * equality, such as the transitive property. This naming is intended to
	 * explicitly express that it is **not transitive**. The
	 * {@link ExpectedChoice} unilaterally dictates equality semantics:
	 *
	 * - When a `label` is present in an assertion's expected choice(s), that
	 *   `label` must be present and compare as equal on the {@link actualChoice}
	 *
	 * - When a `label` is not present in an assertion's expected choice(s), any
	 *   label may be present on the {@link actualChoice}, and it is not consulted
	 *   in comparisons to satisfy the assertion at all
	 */
	checkEquality(actualChoice: ComparableChoice): ComparableChoiceEqualityExpectationResult {
		const { label, value } = this;
		const isValueEqual = actualChoice.value === value;

		let isLabelEqual: IsLabelEqual;

		if (label == null) {
			isLabelEqual = LABEL_EQUALITY_NOT_APPLICABLE;
		} else {
			isLabelEqual = actualChoice.label === label;
		}

		const pass = Boolean(isValueEqual && isLabelEqual);

		return {
			pass,
			isValueEqual,
			isLabelEqual,
		};
	}
}

export const choice = (value: string, labelOrId?: string): ExpectedChoice => {
	return new ExpectedChoice(value, labelOrId ?? null);
};
