import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import { ComparableAnswer } from './ComparableAnswer.ts';

/**
 * @todo (discuss/review below notes)
 *
 * **PORTING NOTES**
 *
 * ### 1. Naming, semantics_
 *
 * The intent of this class's name is to match the apparent intent in JavaRosa,
 * where assertions are made against a question's "display text". In the cases
 * ported so far, that includes apparent "display text" of `<select>`s where
 * multiple values are comparable as a single string of comma-separated values.
 *
 * As such, it **currently** provides support for assertions where the expected
 * value is described as a single string of comma-separated values, where those
 * values correspond to the expected values of a `<select>`s itemset/"inline"
 * items.
 *
 * Other cases may be handled as they're encountered while porting. Otherwise,
 * we may want to consider a variety of changes in naming, expressed test
 * semantics, or other means of making the ported usage less awkward.
 *
 * ### 2. Select item/choice ordering in assertions/comparisons
 *
 * After briefly looking at some initial failures of tests using this answer
 * type, it seemed that they likely should have either passed, or at least
 * passed the specific assertions they first failed on. Specifically, it seemed
 * that the expected select items matched:
 *
 * - All of the expected values
 * - No excess values
 * - No assertion of label values which would potentially fail to match
 *
 * They only failed because the initial comparison was order-sensitive. In
 * hindsight, unless there is some nuance in either the ODK XForms spec, or in
 * expected Collect behavior, it seems to me that `<select>` values should
 * always be set-like, and explicitly order-agnostic.
 *
 * This **may also** call into question the distinction between the current
 * `toContainChoices`/`toContainChoicesInAnyOrder` custom assertions. It seems
 * likely that order **does matter** when comparing _available choices for
 * selection_ (or **could optionally matter**, where some tests may want to
 * validate it and others may ignore it to focus on other details), but should
 * not matter when comparing _selected choices to assert expected values in form
 * state_.
 *
 * At any rate, this type currently sorts its input, which probably still isn't
 * the right semantic approach. It may make more sense to have a specific
 * {@link ComparableAnswer} interface for custom comparison logic, e.g. so that
 * two distinct types of comparables representing multiple selected items can
 * perform the most appropriate comparison for its own semantics. (Something
 * almost exactly like this was explored in other iterations on the many and
 * growing `Comparable*` types, but put on hold after a brief timebox when it
 * felt like
 * {@link https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it | YAGNI}).
 */
export class ExpectedDisplayTextAnswer extends ComparableAnswer {
	readonly values: readonly string[];
	readonly stringValue: string;

	constructor(selectValuesAsCSV: string) {
		super();

		/**
		 * @see {@link ExpectedDisplayTextAnswer} notes on applicability of ordering
		 * in assertions
		 */
		const values = selectValuesAsCSV.split(', ').sort();

		this.values = values;
		this.stringValue = values.join(' ');
	}

	override inspectValue(): JSONValue {
		return this.values;
	}
}

export const answerText = (selectValuesAsCSV: string): ExpectedDisplayTextAnswer => {
	return new ExpectedDisplayTextAnswer(selectValuesAsCSV);
};
