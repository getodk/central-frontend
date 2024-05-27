import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	extendExpect,
	InspectableComparisonError,
	instanceAssertion,
	SymmetricTypedExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
import { ComparableAnswer } from '../../answer/ComparableAnswer.ts';

const answerExtensions = extendExpect(expect, {
	toEqualAnswer: new SymmetricTypedExpectExtension(
		instanceAssertion(ComparableAnswer),
		(actual, expected) => {
			const pass = actual.stringValue === expected.stringValue;

			return pass || new InspectableComparisonError(actual, expected, 'equal');
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
