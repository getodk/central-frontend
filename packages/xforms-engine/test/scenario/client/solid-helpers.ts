import type { Owner } from 'solid-js';
import { getOwner, runWithOwner } from 'solid-js';
import { assert } from 'vitest';

export const getAssertedOwner = (): Owner => {
	const owner = getOwner();

	assert(owner);

	return owner;
};

interface RunInSolidScope {
	<T>(owner: Owner, fn: () => T): T;
	<T>(owner: Owner | null | undefined, fn: () => T): T | undefined;
}

export const runInSolidScope: RunInSolidScope = (owner, fn) => {
	assert(owner);

	return runWithOwner(owner ?? null, fn);
};
