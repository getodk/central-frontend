import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedFloatAnswer extends ComparableAnswer {
	readonly stringValue: string;

	constructor(floatValue: number) {
		super();

		this.stringValue = `${floatValue}`;
	}
}

export const floatAnswer = (floatValue: number): ExpectedFloatAnswer => {
	return new ExpectedFloatAnswer(floatValue);
};
