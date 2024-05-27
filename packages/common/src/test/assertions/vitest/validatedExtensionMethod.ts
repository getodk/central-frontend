import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import type { ExpectExtensionMethod } from './shared-extension-types.ts';

/**
 * Performs validation of a Vitest `expect` extension's runtime arguments,
 * helping to ensure those values match the extension's static parameter types.
 */
export const validatedExtensionMethod = <Actual, Expected, Result>(
	validateActualArgument: AssertIs<Actual>,
	validateExpectedArgument: AssertIs<Expected>,
	typedExtensionMethod: ExpectExtensionMethod<Actual, Expected, Result>
): ExpectExtensionMethod<unknown, unknown, Result> => {
	return (actual, expected) => {
		validateActualArgument(actual);
		validateExpectedArgument(expected);

		return typedExtensionMethod(actual, expected);
	};
};
