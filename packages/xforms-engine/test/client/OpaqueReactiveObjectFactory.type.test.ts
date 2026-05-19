import { createMutable } from 'solid-js/store';
import { describe, expectTypeOf, it } from 'vitest';
import { reactive } from 'vue';
import type { OpaqueReactiveObjectFactory } from '../../src/index.ts';
import { reactiveTestScope } from '../helpers/reactive/internal.ts';

/**
 * This doesn't actually need to do anything at runtime, it's used to type check
 * assignability of factory methods we are targeting explicitly, and may be
 * used in further such checks if other failure cases are found in the future.
 */
const checkReactiveFactoryAssignability = <Factory extends OpaqueReactiveObjectFactory<object>>(
	factory: Factory
): Factory => factory;

// Note: we are not currently running Vitest's type checking runner, but we
// expect to catch errors by running `tsc` as a separate check in CI. We'll also
// be able to see type errors in-editor if we introduce regressions to the
// pertinent types.
//
// If we do want a full fledged type test suite, we may want to consider a
// distinct filename suffix, like `.test-d.ts` (as recommended by Vitest).
describe('OpaqueReactiveObjectFactory types', () => {
	describe('explicitly supported factory function types', () => {
		describe('internal reactivity helper `mutable`', () => {
			it('satisfies the type of OpaqueReactiveObjectFactory', () => {
				// We're not really doing anything with the test scope, but the internal
				// reactivity helper is intentionally designed so you need a scope to
				// access the APIs which depend on it.
				reactiveTestScope(({ mutable }) => {
					mutable satisfies OpaqueReactiveObjectFactory;
				});
			});

			it('is assignable where an OpaqueReactiveObjectFactory parameter is expected', () => {
				reactiveTestScope(({ mutable }) => {
					type InternalMutableFactory = typeof mutable;

					const result = checkReactiveFactoryAssignability(mutable);

					expectTypeOf(result).toMatchTypeOf<InternalMutableFactory>();
				});
			});
		});

		describe("Solid's `createMutable`", () => {
			it('satisfies the type of OpaqueReactiveObjectFactory', () => {
				createMutable satisfies OpaqueReactiveObjectFactory;
			});

			it('is assignable where an OpaqueReactiveObjectFactory parameter is expected', () => {
				type SolidCreateMutable = typeof createMutable;

				const result = checkReactiveFactoryAssignability(createMutable);

				expectTypeOf(result).toMatchTypeOf<SolidCreateMutable>();
			});
		});

		describe("Vue's `reactive`", () => {
			it('satisfies the type of OpaqueReactiveObjectFactory', () => {
				reactive satisfies OpaqueReactiveObjectFactory;
			});

			it('is assignable where an OpaqueReactiveObjectFactory parameter is expected', () => {
				type VueReactive = typeof reactive;

				const result = checkReactiveFactoryAssignability(reactive);

				expectTypeOf(result).toMatchTypeOf<VueReactive>();
			});
		});

		describe('invalid factories', () => {
			describe('string factory', () => {
				type StringFactory = <T extends string>(value: T) => T;

				const stringFactory: StringFactory = (value) => value;

				it('does not satisfy the type of OpaqueReactiveObjectFactory', () => {
					// @ts-expect-error - intentionally does not pass type check
					stringFactory satisfies OpaqueReactiveObjectFactory;
				});

				it('is not assignable where an OpaqueReactiveObjectFactory parameter is expected', () => {
					// @ts-expect-error - intentionally does not pass type check
					checkReactiveFactoryAssignability(stringFactory);
				});
			});
		});
	});
});
