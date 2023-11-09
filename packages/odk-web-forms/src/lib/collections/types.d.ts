// TODO: this is copypasta of the same type in `@odk/xpath`. It will make sense
// to share utility types like this somewhere, but what makes the most sense? Is
// there some idiomatic reference to copy?
export type CollectionValues<T> = T extends ArrayLike<infer U>
	? U
	: T extends ReadonlyArray<infer U>
	? U
	: T extends Array<infer U>
	? U
	: T extends ReadonlySet<infer U>
	? U
	: T extends Set<infer U>
	? U
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends ReadonlyMap<any, infer U>
	? U
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Map<any, infer U>
	? U
	: never;
