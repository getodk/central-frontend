import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	extendExpect,
} from '@getodk/common/test/assertions/helpers.ts';
import type { RootNode } from '@getodk/xforms-engine';
import { expect } from 'vitest';
import { assertArrayOfStrings, assertRootNode, assertString } from './shared-type-assertions.ts';

const hasClass = (node: RootNode, className: string): boolean => {
	return node.classes?.[className] === true;
};

const bodyClassesExtensions = extendExpect(expect, {
	toHaveClass: new AsymmetricTypedExpectExtension(
		assertRootNode,
		assertString,
		(actual, expected) => {
			if (hasClass(actual, expected)) {
				return true;
			}

			return new Error(
				`RootNode ${actual.currentState.reference} does not have class "${expected}"`
			);
		}
	),

	notToHaveClass: new AsymmetricTypedExpectExtension(
		assertRootNode,
		assertString,
		(actual, expected) => {
			if (hasClass(actual, expected)) {
				return new Error(
					`RootNode ${actual.currentState.reference} has class "${expected}", which was not expected`
				);
			}

			return true;
		}
	),

	toYieldClasses: new AsymmetricTypedExpectExtension(
		assertRootNode,
		assertArrayOfStrings,
		(actual, expected) => {
			const yielded = new Set<string>();

			for (const className of actual.classes) {
				yielded.add(className);
			}

			const notYielded = expected.filter((item) => {
				return !yielded.has(item);
			});

			if (notYielded.length === 0) {
				return true;
			}

			return new Error(
				`RootNode ${actual.currentState.reference} did not yield expected classes ${notYielded.join(', ')}`
			);
		}
	),
});

type BodyClassExtensions = typeof bodyClassesExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<BodyClassExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<BodyClassExtensions> {}
}
