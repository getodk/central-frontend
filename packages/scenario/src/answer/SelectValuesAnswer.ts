import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

/**
 * Produces a value which may be **assigned** to a {@link SelectNode}, e.g.
 * as part of a test's "act" phase.
 */
export class SelectValuesAnswer extends ComparableAnswer {
	/**
	 * @todo This is currently produced by joining the input string values with
	 * whitespace. This is correct for `<select>`, and ideally corresponds to
	 * calls relating to fields of that type. Is there a way we can safeguard that
	 * it isn't called incorrectly for `<select1>` (where joining multiple values
	 * is undesirable)?
	 */
	readonly stringValue: string;

	constructor(readonly values: readonly string[]) {
		super();

		this.stringValue = values.join(' ');
	}

	override inspectValue(): JSONValue {
		return this.values;
	}
}
