import type { AssertIs } from '../../../types/assertions/AssertIs.ts';

type ArrayItemAssertion<T> = (item: unknown) => asserts item is T;

export const arrayOfAssertion = <T>(
	assertItem: ArrayItemAssertion<T>,
	itemTypeDescription: string
): AssertIs<readonly T[]> => {
	return (value) => {
		if (!Array.isArray(value)) {
			throw new Error(`Not an array of ${itemTypeDescription}: value itself is not an array`);
		}

		for (const [index, item] of value.entries()) {
			try {
				assertItem(item);
			} catch {
				throw new Error(
					`Not an array of ${itemTypeDescription}: item at index ${index} not an instance`
				);
			}
		}
	};
};
