export type Identity<T> = T;

export type Merge<T> = Identity<{
	[K in keyof T]: T[K];
}>;
