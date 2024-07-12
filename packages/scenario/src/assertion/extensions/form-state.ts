import { assertInstanceType } from '@getodk/common/lib/runtime-types/instance-predicates.ts';
import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	ArbitraryConditionExpectExtension,
	extendExpect,
} from '@getodk/common/test/assertions/helpers.ts';
import { expect } from 'vitest';
import { JRFormDef } from '../../jr/form/JRFormDef.ts';

type AssertJRFormDef = (value: unknown) => asserts value is JRFormDef;

const assertJRFormDef: AssertJRFormDef = (value) => assertInstanceType(JRFormDef, value);

const formStateExtensions = extendExpect(expect, {
	/**
	 * **PORTING NOTES**
	 *
	 * This custom assertion is close in name to assertions in the test currently
	 * being ported which will call it. It seems risky to use such a general name
	 * for such a specific concept. In consideration of alternatives, it might be
	 * nice to think about how we could use the already BDD-ish formulation of
	 * assertions to express not just the presence or absence of constraint
	 * violations, but what specific violations they might be, or what their
	 * violation messages might be. For instance:
	 *
	 * ```ts
	 * expect(...).not.toHaveConstraintViolations()
	 * expect(...).toHaveConstraintViolations([
	 *   // ...something about what constraints are violated here ...
	 * ])
	 * ```
	 */
	toBeValid: new ArbitraryConditionExpectExtension(assertJRFormDef, (actual) => {
		if (actual.scenario.instanceRoot.validationState.violations.length) {
			return new Error();
		}

		return true;
	}),
});

type FormStateExtensions = typeof formStateExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<FormStateExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<FormStateExtensions> {}
}
