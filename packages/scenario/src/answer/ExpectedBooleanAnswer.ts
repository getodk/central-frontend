import { InspectableComparisonError } from '@getodk/common/test/assertions/helpers.ts';
import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedBooleanAnswer extends ComparableAnswer {
	readonly stringValue: string;

	constructor(override readonly booleanValue: boolean) {
		super();

		/**
		 * @todo Consistency of boolean serialization.
		 */
		this.stringValue = booleanValue ? '1' : '0';
	}

	override equals(actual: ComparableAnswer): SimpleAssertionResult | null {
		const { booleanValue: actualBooleanValue } = actual;

		if (typeof actualBooleanValue === 'boolean') {
			const pass = this.booleanValue === actualBooleanValue;

			return pass || new InspectableComparisonError(actual, this, 'equal');
		}

		return null;
	}
}

export const booleanAnswer = (booleanValue: boolean): ExpectedBooleanAnswer => {
	return new ExpectedBooleanAnswer(booleanValue);
};
