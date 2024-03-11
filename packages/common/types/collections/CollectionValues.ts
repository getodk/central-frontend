import type { Identity } from '../helpers';

// prettier-ignore
export type CollectionValues<T> = Identity<
	T extends ArrayLike<infer U>
		? U
	: T extends ReadonlyArray<infer U>
		? U
	: T extends Array<infer U>
		? U
	: T extends ReadonlySet<infer U>
		? U
	: T extends Set<infer U>
		? U
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	: T extends ReadonlyMap<any, infer U>
		? U
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	: T extends Map<any, infer U>
		? U
		: never
>;
