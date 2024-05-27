import type { ComparableAnswer } from '../answer/ComparableAnswer.ts';
import type { CustomAssertionResult } from './CustomAssertionResult.ts';

export class AnswerComparisonResult implements CustomAssertionResult {
	constructor(
		readonly comparisonVerb: string,
		readonly expectedAnswer: ComparableAnswer,
		readonly actualAnswer: ComparableAnswer,
		readonly pass: boolean
	) {}

	readonly message = (): string => {
		const { actualAnswer, comparisonVerb, expectedAnswer } = this;
		const actual = JSON.stringify(actualAnswer.inspectValue());
		const expected = JSON.stringify(expectedAnswer.inspectValue());

		return `Expected ${actual} to ${comparisonVerb} ${expected}`;
	};
}
