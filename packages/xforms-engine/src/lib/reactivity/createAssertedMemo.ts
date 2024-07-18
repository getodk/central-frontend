import { createMemo, type Accessor } from 'solid-js';
import type { ReactiveScope } from './scope.ts';

export const createAssertedMemo = <T, U extends T>(
	scope: ReactiveScope,
	fn: Accessor<T>,
	assert: (value: T) => asserts value is U
): Accessor<U> => {
	return scope.runTask(() => {
		return createMemo((): U => {
			const value = fn();

			assert(value);

			return value;
		});
	});
};
