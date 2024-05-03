import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	extendExpect,
	InspectableComparisonError,
	instanceAssertion,
	SymmetricTypedExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
import { ComparableAnswer } from '../../answer/ComparableAnswer.ts';
import { AnswerResult } from '../../jr/Scenario.ts';
import { ValidationImplementationPendingError } from '../../jr/validation/ValidationImplementationPendingError.ts';

const assertComparableAnswer = instanceAssertion(ComparableAnswer);

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
		assertComparableAnswer,
		assertAnswerResult,
		(_actual, _expected) => {
			return new ValidationImplementationPendingError();
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
