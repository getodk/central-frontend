import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	extendExpect,
	StaticConditionExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
import { assertEngineNode } from './shared-type-assertions.ts';

export const nodeStateExtensions = extendExpect(expect, {
	toBeRelevant: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { relevant: true },
	}),
	toBeNonRelevant: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { relevant: false },
	}),

	toBeRequired: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { required: true },
	}),
	toBeOptional: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { required: false },
	}),

	/**
	 * **PORTING NOTES**
	 *
	 * This assertion extension's name is currently derived from JavaRosa's
	 * assertions phrased like `assertThat(..., is(enabled()))`. It is clearly
	 * concerned with a node **not** being read-only (i.e. either its `bind` has
	 * no `readonly` expression, or that expression evaluates to `false`).
	 *
	 * The corresponding affirmative assertion is (more obviously) named
	 * `readOnly`.
	 *
	 * These assertion semantics are preserved for now, but we should consider
	 * using negated assertions of the more clearly named `toBeReadonly` custom
	 * assertion below (e.g. `expect(...).not.toBeReadonly()`).
	 */
	toBeEnabled: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { readonly: false },
	}),

	/**
	 * **PORTING NOTES**
	 *
	 * While JavaRosa uses the more colloquially comfortable `readOnly`
	 * capitalization (which would correspond to the term being two words or
	 * hyphenated), it felt more appropriate to preserve the single-word nature
	 * here since it directly references XForms spec semantics where the state is
	 * determined by the result of a `<bind readonly>` expression.
	 */
	toBeReadonly: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { readonly: true },
	}),
});

type NodeStateExtensions = typeof nodeStateExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<NodeStateExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<NodeStateExtensions> {}
}
