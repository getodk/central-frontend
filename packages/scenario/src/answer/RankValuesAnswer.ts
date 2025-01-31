import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { RankNode } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

/**
 * Produces a value which may be **assigned** to a {@link RankNode}, e.g.
 * as part of a test's "act" phase.
 */
export class RankValuesAnswer extends ComparableAnswer {
	readonly stringValue: string;

	constructor(readonly values: readonly string[]) {
		super();

		this.stringValue = values.join(' ');
	}

	override inspectValue(): JSONValue {
		return this.values;
	}
}
