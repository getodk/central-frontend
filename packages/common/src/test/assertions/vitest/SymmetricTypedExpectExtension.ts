import type { SyncExpectationResult } from 'vitest';
import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import { expandSimpleExpectExtensionResult } from './expandSimpleExpectExtensionResult.ts';
import type { ExpectExtensionMethod } from './shared-extension-types.ts';
import { validatedExtensionMethod } from './validatedExtensionMethod.ts';

/**
 * Generalizes definition of a Vitest `expect` API extension where the assertion
 * expects the same type for both its `actual` and `expected` parameters, and:
 *
 * - Automatically perfoms runtime validation of those parameters, helping to
 *   ensure that the extensions' static types are consistent with the runtime
 *   values passed in a given test's assertions
 *
 * - Expands simplified assertion result types to the full interface expected
 *   by Vitest
 *
 * - Facilitates deriving and defining corresponding static types on the
 *   base `expect` type
 */
export class SymmetricTypedExpectExtension<Parameter = unknown> {
	readonly extensionMethod: ExpectExtensionMethod<unknown, unknown, SyncExpectationResult>;

	constructor(
		readonly validateArgument: AssertIs<Parameter>,
		extensionMethod: ExpectExtensionMethod<Parameter, Parameter>
	) {
		const validatedMethod = validatedExtensionMethod(
			validateArgument,
			validateArgument,
			extensionMethod
		);

		this.extensionMethod = expandSimpleExpectExtensionResult(validatedMethod);
	}
}
