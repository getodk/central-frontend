import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	extendExpect,
	InspectableComparisonError,
	instanceAssertion,
	SymmetricTypedExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - it is unclear why TypeScript does not see this specific import
// referenced in the JSDoc block below... it usually doesn't error for this
// exact pattern of of usage.
import type { Scenario } from '../../jr/Scenario.ts';
import { JRTreeReference } from '../../jr/xpath/JRTreeReference.ts';

const assertJRTreeReference = instanceAssertion(JRTreeReference);

const treeReferenceExtensions = extendExpect(expect, {
	/**
	 * **PORTING NOTES**
	 *
	 * This is pre-emptively marked as deprecated, based on assumptions detailed
	 * below. If we agree on these assumptions, let's remove this preamble (or
	 * just migrate the affected tests and remove this custom assertion entirely).
	 *
	 * @deprecated
	 *
	 * Exists only to support direct ports of `TreeReference` equality assertions,
	 * generally about the current progress state while a test advances through a
	 * form. Insofar as such tests are meaningful, they'll tend to be about the
	 * availability of certain nodes (e.g. relevance, repeat instance presence, or
	 * just generally about the presence of certain features as parsed and
	 * represented by the engine's state).
	 *
	 * Tests calling this assertion should very likely be updated to use other
	 * mechanisms to assert these conditions (which they may already be doing, by
	 * advancing through form state with {@link Scenario} methods (e.g. {@link Scenario.next}) which assert the
	 * same expected reference on each call).
	 *
	 */
	toEqualTreeReference: new SymmetricTypedExpectExtension(
		assertJRTreeReference,
		(actual, expected) => {
			const pass = actual.xpathReference === expected.xpathReference;

			return pass || new InspectableComparisonError(actual, expected, 'equal');
		}
	),
});

type TreeReferenceExtensions = typeof treeReferenceExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any>
		extends DeriveStaticVitestExpectExtension<TreeReferenceExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<TreeReferenceExtensions> {}
}
