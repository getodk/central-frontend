import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	extendExpect,
} from '@getodk/common/test/assertions/helpers.ts';
import type { AnyNode } from '@getodk/xforms-engine';
import { expect } from 'vitest';
import { assertArrayOfStrings, assertEngineNode, assertString } from './shared-type-assertions.ts';

const hasAppearance = (node: AnyNode, appearance: string): boolean => {
	return node.appearances?.[appearance] === true;
};

const appearanceExtensions = extendExpect(expect, {
	toHaveAppearance: new AsymmetricTypedExpectExtension(
		assertEngineNode,
		assertString,
		(actual, expected) => {
			if (hasAppearance(actual, expected)) {
				return true;
			}

			return new Error(
				`Node ${actual.currentState.reference} does not have appearance "${expected}"`
			);
		}
	),

	notToHaveAppearance: new AsymmetricTypedExpectExtension(
		assertEngineNode,
		assertString,
		(actual, expected) => {
			if (hasAppearance(actual, expected)) {
				return new Error(
					`Node ${actual.currentState.reference} has appearance "${expected}", which was not expected`
				);
			}

			return true;
		}
	),

	toYieldAppearances: new AsymmetricTypedExpectExtension(
		assertEngineNode,
		assertArrayOfStrings,
		(actual, expected) => {
			const yielded = new Set<string>();

			for (const appearance of actual.appearances ?? []) {
				yielded.add(appearance);
			}

			const notYielded = expected.filter((item) => {
				return !yielded.has(item);
			});

			if (notYielded.length === 0) {
				return true;
			}

			return new Error(
				`Node ${actual.currentState.reference} did not yield expected appearances ${notYielded.join(', ')}`
			);
		}
	),
});

type AppearanceExtensions = typeof appearanceExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<AppearanceExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<AppearanceExtensions> {}
}
