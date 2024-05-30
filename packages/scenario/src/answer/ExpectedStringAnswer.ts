import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedStringAnswer extends ComparableAnswer {
	constructor(readonly stringValue: string) {
		super();
	}
}

export const stringAnswer = (stringValue: string): ExpectedStringAnswer => {
	return new ExpectedStringAnswer(stringValue);
};
