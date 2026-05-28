import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedIntAnswer extends ComparableAnswer {
	readonly stringValue: string;

	constructor(intValue: bigint | number) {
		super();

		if (typeof intValue === 'number' && !Number.isInteger(intValue)) {
			throw new Error(`Invalid non-integer expectation`);
		}

		this.stringValue = `${intValue}`;
	}
}

export const intAnswer = (intValue: bigint | number): ExpectedIntAnswer => {
	return new ExpectedIntAnswer(intValue);
};
