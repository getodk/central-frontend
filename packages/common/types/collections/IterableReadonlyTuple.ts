import type { ReadonlyTuple } from './ReadonlyTuple';

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type IterableReadonlyTuple<T, Length extends number> = ReadonlyTuple<T, Length> &
	Pick<readonly T[], 'entries' | 'keys' | 'values'>;
