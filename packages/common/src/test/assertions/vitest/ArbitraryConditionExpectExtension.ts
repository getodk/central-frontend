import type { SyncExpectationResult } from 'vitest';
import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import { assertVoidExpectedArgument } from './assertVoidExpectedArgument.ts';
import { expandSimpleExpectExtensionResult } from './expandSimpleExpectExtensionResult.ts';
import type { ExpectExtensionMethod } from './shared-extension-types.ts';
import { validatedExtensionMethod } from './validatedExtensionMethod.ts';

export class ArbitraryConditionExpectExtension<Parameter> {
	readonly extensionMethod: ExpectExtensionMethod<unknown, unknown, SyncExpectationResult>;

	constructor(
		readonly validateArgument: AssertIs<Parameter>,
		readonly arbitraryCondition: ExpectExtensionMethod<Parameter, void>
	) {
		const validatedMethod = validatedExtensionMethod(
			validateArgument,
			assertVoidExpectedArgument,
			arbitraryCondition
		);

		this.extensionMethod = expandSimpleExpectExtensionResult(validatedMethod);
	}
}
