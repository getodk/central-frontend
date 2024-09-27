import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	extendExpect,
} from '@getodk/common/test/assertions/helpers.ts';
import { assert, expect } from 'vitest';
import { Scenario } from '../../jr/Scenario.ts';
import { ComparableXMLSerialization } from '../../serialization/ComparableXMLSerialization.ts';
import { assertString } from './shared-type-assertions.ts';

type AssertScenario = (value: unknown) => asserts value is Scenario;

const assertScenario: AssertScenario = (value) => {
	assert(value instanceof Scenario);
};

export const submissionExtensions = extendExpect(expect, {
	toHaveSerializedSubmissionXML: new AsymmetricTypedExpectExtension(
		assertScenario,
		assertString,
		(actual, expected) => {
			const comparableActual = new ComparableXMLSerialization(actual.proposed_serializeInstance());
			const comparableExpected = new ComparableXMLSerialization(expected);

			return comparableActual.equals(comparableExpected);
		}
	),
});

type SubmissionExtensions = typeof submissionExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<SubmissionExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<SubmissionExtensions> {}
}
