import type { ConstructorOf } from '@getodk/common/types/helpers.d.ts';
import { arrayOfAssertion } from './arrayOfAssertion.ts';
import type { AssertIs } from './AssertIs.ts';
import { instanceAssertion } from './instanceAssertion.ts';

/**
 * Creates a type assertion function, used to validate both statically and at
 * runtime that a value is an array, and each item in the array is an instance
 * of the provided {@link Constructor}.
 */
export const instanceArrayAssertion = <T>(
	Constructor: ConstructorOf<T>
): AssertIs<readonly T[]> => {
	const assertInstance: AssertIs<T> = instanceAssertion(Constructor);

	return arrayOfAssertion(assertInstance, Constructor.name);
};
