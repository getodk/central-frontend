import type { Accessor, Setter, Signal } from 'solid-js';

export const createUninitialized = <T>(message?: string): Signal<T> => {
	const get: Accessor<T> = () => {
		throw new Error(message ?? 'Not initialized');
	};
	const set: Setter<T> = () => {
		throw new Error(message ?? 'Not initialized');
	};

	return [get, set];
};

export const createUninitializedAccessor = <T>(message?: string): Accessor<T> => {
	const [get] = createUninitialized<T>(message);

	return get;
};
