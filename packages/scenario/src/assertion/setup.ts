import type { JestAssertion as JestStyleAssertion } from 'vitest';
import { expect } from 'vitest';
import { ComparableAnswer } from '../answer/ComparableAnswer.ts';
import { AnswerComparisonResult } from './AnswerComparisonResult.ts';
import type { CustomAssertionResult } from './CustomAssertionResult.ts';

type AnswerComparison = (
	expected: ComparableAnswer,
	actual: ComparableAnswer
) => AnswerComparisonResult;

type JestStyleExpectation = <E>(expected: E) => void;

// prettier-ignore
type JestStyleExpectationKey = {
	[K in keyof JestStyleAssertion]:
		JestStyleAssertion[K] extends JestStyleExpectation
			? K
			: never;
}[keyof JestStyleAssertion];

/**
 * The methods of this type are designed to map a generalized comparison between
 * {@link ComparableAnswer} instances to the most common Jest-style expectation
 * semantics of Vitest's {@link https://vitest.dev/api/expect.html | built-in}
 * assertions/matchers.
 */
type JestStyleAnswerExtensions = {
	[K in JestStyleExpectationKey]: AnswerComparison;
};

const answerComparators = {
	toEqual: (expected: ComparableAnswer, actual: ComparableAnswer) => {
		const pass = expected.stringValue === actual.stringValue;

		return new AnswerComparisonResult('equal', expected, actual, pass);
	},
} as const satisfies Partial<JestStyleAnswerExtensions>;

const INVALID_ANSWER_COMPARISON_OPERAND_RESULT = {
	pass: false,
	message: () => 'Expected both comparison operands to be instances of ComparableAnswer',
};

interface AnswerExtensions<R = unknown> {
	readonly toEqualAnswer: (answer: ComparableAnswer) => R;
}

type AnswerExtensionImplementation = (actual: unknown, expected: unknown) => CustomAssertionResult;

type AnswerExtensionImplementations = {
	[K in keyof AnswerExtensions]: AnswerExtensionImplementation;
};

const answerExtensions = {
	toEqualAnswer: (actual: unknown, expected: unknown) => {
		if (actual instanceof ComparableAnswer && expected instanceof ComparableAnswer) {
			return answerComparators.toEqual(expected, actual);
		}

		return INVALID_ANSWER_COMPARISON_OPERAND_RESULT;
	},
} as const satisfies AnswerExtensionImplementations;

expect.extend(answerExtensions);

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends AnswerExtensions<T> {}
	interface AsymmetricMatchersContaining extends AnswerExtensions {}
}
