import type { AssertIs } from './AssertIs.ts';
import type { ConstructorOf } from '@getodk/common/types/helpers.d.ts';

/**
 * Creates a type assertion function, used to validate both statically and at
 * runtime that a value is an instance of the provided {@link Constructor}.
 */
export const instanceAssertion = <T>(Constructor: ConstructorOf<T>): AssertIs<T> => {
	return (value) => {
		if (!(value instanceof Constructor)) {
			throw new Error(`Not an instance of ${Constructor.name}`);
		}
	};
};
