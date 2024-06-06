import type { AssertIs } from '../../../types/assertions/AssertIs.ts';
import type { ConstructorOf } from '../../../types/helpers';
import { arrayOfAssertion } from './arrayOfAssertion.ts';
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
