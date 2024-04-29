import type { AssertIs } from '../../../../types/assertions/AssertIs.ts';
import { UnreachableError } from '../../../lib/error/UnreachableError.ts';
import {
	assertVoidExpectedArgument,
	type AssertVoidExpectedArgument,
} from './assertVoidExpectedArgument.ts';
import type { ExpectExtensionMethod } from './shared-extension-types.ts';

// prettier-ignore
type ValidateExpectedArgument<Expected> =
	| AssertIs<Expected>
	| AssertVoidExpectedArgument

const isAssertVoidValidation = <Expected>(
	validateExpectedArgument: ValidateExpectedArgument<Expected>
): validateExpectedArgument is AssertVoidExpectedArgument => {
	return validateExpectedArgument === assertVoidExpectedArgument;
};

const isArbitraryTypeAssertion = <Expected>(
	validateExpectedArgument: ValidateExpectedArgument<Expected>
): validateExpectedArgument is AssertIs<Expected> => {
	return validateExpectedArgument !== assertVoidExpectedArgument;
};

/**
 * Performs validation of a Vitest `expect` extension's runtime arguments,
 * helping to ensure those values match the extension's static parameter types.
 */
export const validatedExtensionMethod = <Actual, Expected, Result>(
	validateActualArgument: AssertIs<Actual>,
	validateExpectedArgument: ValidateExpectedArgument<Expected>,
	typedExtensionMethod: ExpectExtensionMethod<Actual, Expected, Result>
): ExpectExtensionMethod<unknown, unknown, Result> => {
	return (actual, ...rest) => {
		validateActualArgument(actual);

		let expected: Expected;

		if (isArbitraryTypeAssertion(validateExpectedArgument)) {
			const arbitraryTypeAssertion: AssertIs<Expected> = validateExpectedArgument;
			const [expectedArg] = rest;

			arbitraryTypeAssertion(expectedArg);

			expected = expectedArg;
		} else if (isAssertVoidValidation(validateExpectedArgument)) {
			const assertVoid: AssertVoidExpectedArgument = validateExpectedArgument;

			assertVoid(rest);

			// @ts-expect-error - this seems like it should be narrowable so it
			// doesn't need a cast, but I'm throwing in the towel for now.
			expected = rest[0];
		} else {
			throw new UnreachableError(validateExpectedArgument);
		}

		return typedExtensionMethod(actual, expected);
	};
};
