import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	AsyncAsymmetricTypedExpectExtension,
	InspectableComparisonError,
	StaticConditionExpectExtension,
	SymmetricTypedExpectExtension,
	extendExpect,
	instanceAssertion,
} from '@getodk/common/test/assertions/helpers.ts';
import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import { constants, type ValidationCondition } from '@getodk/xforms-engine';
import { assert, expect } from 'vitest';
import { ComparableAnswer } from '../../answer/ComparableAnswer.ts';
import { ExpectedApproximateUOMAnswer } from '../../answer/ExpectedApproximateUOMAnswer.ts';
import { ExpectedBinaryAnswer } from '../../answer/ExpectedBinaryAnswer.ts';
import { UploadNodeAnswer } from '../../answer/UploadNodeAnswer.ts';
import type { ValueNode } from '../../answer/ValueNodeAnswer.ts';
import { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { AnswerResult } from '../../jr/Scenario.ts';
import { assertNullableString, assertString } from './shared-type-assertions.ts';

const assertComparableAnswer = instanceAssertion(ComparableAnswer);

const assertValueNodeAnswer = instanceAssertion<ValueNodeAnswer<ValueNode>>(ValueNodeAnswer);

const assertExpectedApproximateUOMAnswer = instanceAssertion(ExpectedApproximateUOMAnswer);

type AssertAnswerResult = (value: unknown) => asserts value is AnswerResult;

const answerResults = new Set<AnswerResult>(Object.values(AnswerResult));

const assertAnswerResult: AssertAnswerResult = (value) => {
	if (!answerResults.has(value as AnswerResult)) {
		throw new Error(
			`Expected assertion of an AnswerResult (an expected result of \`constraint\` or \`required\` status check). Got ${String(value)}`
		);
	}
};

const matchDefaultMessage = (condition: ValidationCondition) => {
	const expectedMessage = constants.VALIDATION_TEXT[`${condition}Msg`];

	return {
		node: {
			validationState: {
				[condition]: {
					valid: false,
					message: {
						origin: 'engine',
						asString: expectedMessage,
					},
				},
				violation: {
					condition,
					message: {
						origin: 'engine',
						asString: expectedMessage,
					},
				},
			},
		},
	};
};

const assertUploadNodeAnswer = instanceAssertion(UploadNodeAnswer);
const assertBinaryAnswer = instanceAssertion(ExpectedBinaryAnswer);

export const answerExtensions = extendExpect(expect, {
	toEqualAnswer: new SymmetricTypedExpectExtension(assertComparableAnswer, (actual, expected) => {
		let result: SimpleAssertionResult | null = null;

		if (typeof expected.equals === 'function') {
			result = expected.equals(actual);
		}

		if (result == null && typeof actual.equals === 'function') {
			result = actual.equals(expected);
		}

		if (result == null) {
			const pass = actual.stringValue === expected.stringValue;

			result = pass || new InspectableComparisonError(actual, expected, 'equal');
		}

		return result;
	}),

	toHaveAnswerCloseTo: new AsymmetricTypedExpectExtension(
		assertComparableAnswer,
		assertExpectedApproximateUOMAnswer,
		(actual, expected) => {
			const pass = expected.isCloseTo(actual);

			return pass || new InspectableComparisonError(actual, expected, 'close to');
		}
	),

	/**
	 * **PORTING NOTES**
	 *
	 * - In preparing to define this assertion extension, I went to look at the
	 *   {@link https://getodk.github.io/xforms-spec/#bind-attributes | Bind Attributes}
	 *   spec section. The `constraint` spec language is clearly intended to
	 *   reference the W3C spec's own
	 *   {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice6.html#model-prop-validate | `constraint` specification},
	 *   but it links to the W3C's `relevant` spec (and presumably should be
	 *   updated to use the correct link).
	 *
	 * - Confirmed, in a quick Slack conversation, that it's safe to assume
	 *   `constraint` is only applied to leaf/value nodes. The discussion also
	 *   raised a recent request for group-level `constraint`s, so it's probably
	 *   wise to keep this clarification around in case we want to revisit this in
	 *   the spec.
	 */
	toHaveValidityStatus: new AsymmetricTypedExpectExtension(
		assertValueNodeAnswer,
		assertAnswerResult,
		(actual, expected) => {
			const { condition } = actual.node.validationState.violation ?? {};
			let pass: boolean;

			switch (expected) {
				case AnswerResult.CONSTRAINT_VIOLATED:
					pass = condition === 'constraint';
					break;

				case AnswerResult.REQUIRED_BUT_EMPTY:
					pass = condition === 'required';
					break;

				case AnswerResult.OK:
					pass = condition == null;
					break;

				default:
					return new UnreachableError(expected);
			}

			return pass || new InspectableComparisonError(actual, expected, 'be');
		}
	),

	toHaveConstraintMessage: new AsymmetricTypedExpectExtension(
		assertValueNodeAnswer,
		assertNullableString,
		(actual, expected) => {
			const { asString = null } = actual.node.validationState.constraint?.message ?? {};
			const pass = asString === expected;

			return pass || new InspectableComparisonError(asString, expected, 'to be message');
		}
	),

	toHaveRequiredMessage: new AsymmetricTypedExpectExtension(
		assertValueNodeAnswer,
		assertNullableString,
		(actual, expected) => {
			const { asString = null } = actual.node.validationState.required?.message ?? {};
			const pass = asString === expected;

			return pass || new InspectableComparisonError(asString, expected, 'to be message');
		}
	),

	toHaveValidityMessage: new AsymmetricTypedExpectExtension(
		assertValueNodeAnswer,
		assertNullableString,
		(actual, expected) => {
			const { asString = null } = actual.node.validationState.violation?.message ?? {};
			const pass = asString === expected;

			return pass || new InspectableComparisonError(asString, expected, 'to be message');
		}
	),

	toHaveDefaultConstraintMessage: new StaticConditionExpectExtension(
		assertValueNodeAnswer,
		matchDefaultMessage('constraint')
	),

	toHaveDefaultRequiredMessage: new StaticConditionExpectExtension(
		assertValueNodeAnswer,
		matchDefaultMessage('required')
	),

	/**
	 * Asserts that the `actual` {@link ComparableAnswer} has a string value which
	 * starts with the `expected` string.
	 *
	 * **PORTING NOTES**
	 *
	 * Consider other names? This is specifically concerned with asserting that
	 * the string value of an answer starts with the provided string. The name
	 * suggests something more general. Any answer-specific naming I could think
	 * of felt more awkward at the call site.
	 *
	 * We could also consider making this a more general string comparison
	 * assertion (I was surprised one didn't already exist!).
	 */
	toStartWith: new AsymmetricTypedExpectExtension(
		assertComparableAnswer,
		assertString,
		(actual, expected) => {
			const pass = actual.toString().startsWith(expected);

			return pass || new InspectableComparisonError(actual, expected, 'start with');
		}
	),

	toEqualUploadedAnswer: new AsyncAsymmetricTypedExpectExtension(
		assertUploadNodeAnswer,
		assertBinaryAnswer,
		async (actualAnswer, expectedAnswer): Promise<SimpleAssertionResult> => {
			const actual = actualAnswer.value;
			const expected = expectedAnswer.value;

			try {
				if (expected == null) {
					expect(actual).toBe(expected);
					assert(actual == null, 'Expected a blank upload value');

					return true;
				}

				assert(actual != null, 'Expected a non-blank upload value');

				expect(actual.name).toEqual(expected.name);
				expect(actual.type).toEqual(expected.type);

				const [actualData, expectedData] = await Promise.all([
					getBlobText(actual),
					getBlobText(expected),
				]);

				expect(actualData).toEqual(expectedData);

				return true;
			} catch (error) {
				if (error instanceof Error) {
					return error;
				}

				// eslint-disable-next-line no-console
				console.error(error);
				return new Error('Unknown error');
			}
		}
	),
});

type AnswerExtensions = typeof answerExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<AnswerExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<AnswerExtensions> {}
}
