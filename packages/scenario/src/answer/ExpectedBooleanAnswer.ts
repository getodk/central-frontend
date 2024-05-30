import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedBooleanAnswer extends ComparableAnswer {
	readonly stringValue: string;

	constructor(booleanValue: boolean) {
		super();

		/**
		 * @todo Consistency of boolean serialization.
		 */
		this.stringValue = booleanValue ? '1' : '0';
	}
}

export const booleanAnswer = (booleanValue: boolean): ExpectedBooleanAnswer => {
	return new ExpectedBooleanAnswer(booleanValue);
};
