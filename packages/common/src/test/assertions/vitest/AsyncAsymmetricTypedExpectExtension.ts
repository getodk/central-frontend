import type { SyncExpectationResult } from 'vitest';
import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import { expandAsyncExpectExtensionResult } from './expandAsyncExpectExtensionResult.ts';
import type { ExpectExtensionMethod, SimpleAssertionResult } from './shared-extension-types.ts';
import { validatedExtensionMethod } from './validatedExtensionMethod.ts';

/**
 * Generalizes definition of a Vitest `expect` API extension where the assertion
 * expects differing types for its `actual` and `expected` parameters, and:
 *
 * - Automatically perfoms runtime validation of those parameters, helping to
 *   ensure that the extensions' static types are consistent with the runtime
 *   values passed in a given test's assertions
 *
 * - Expands simplified assertion result types to the full interface expected by
 *   Vitest
 *
 * - Facilitates deriving and defining corresponding static types on the base
 *   `expect` type
 */
export class AsyncAsymmetricTypedExpectExtension<
	Actual = unknown,
	Expected = Actual,
	Result extends SimpleAssertionResult = SimpleAssertionResult,
> {
	readonly extensionMethod: ExpectExtensionMethod<unknown, unknown, Promise<SyncExpectationResult>>;

	constructor(
		readonly validateActualArgument: AssertIs<Actual>,
		readonly validateExpectedArgument: AssertIs<Expected>,
		extensionMethod: ExpectExtensionMethod<Actual, Expected, Promise<Result>>
	) {
		const validatedMethod = validatedExtensionMethod(
			validateActualArgument,
			validateExpectedArgument,
			extensionMethod
		);

		this.extensionMethod = expandAsyncExpectExtensionResult(validatedMethod);
	}
}
