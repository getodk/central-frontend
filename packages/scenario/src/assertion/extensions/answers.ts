import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	InspectableComparisonError,
	SymmetricTypedExpectExtension,
	extendExpect,
	instanceAssertion,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
import { ComparableAnswer } from '../../answer/ComparableAnswer.ts';
import { ExpectedApproximateUOMAnswer } from '../../answer/ExpectedApproximateUOMAnswer.ts';
import type { ValueNode } from '../../answer/ValueNodeAnswer.ts';
import { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { AnswerResult } from '../../jr/Scenario.ts';
import { assertString } from './shared-type-assertions.ts';

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

const answerExtensions = extendExpect(expect, {
	toEqualAnswer: new SymmetricTypedExpectExtension(assertComparableAnswer, (actual, expected) => {
		const pass = actual.stringValue === expected.stringValue;

		return pass || new InspectableComparisonError(actual, expected, 'equal');
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

			return pass || new InspectableComparisonError(condition, expected, 'be');
		}
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
});

type AnswerExtensions = typeof answerExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<AnswerExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<AnswerExtensions> {}
}
