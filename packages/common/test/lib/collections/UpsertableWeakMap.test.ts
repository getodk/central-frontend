import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UpsertableWeakMap } from '../../../src/lib/collections/UpsertableWeakMap.ts';

describe('UpsertableWeakMap', () => {
	class Key {
		constructor(readonly key: string) {}
	}

	class Value {
		constructor(readonly value: string) {}
	}

	let testMap: UpsertableWeakMap<Key, Value> | null = null;
	let initialKey!: Key;
	let initialValue!: Value;

	beforeEach(() => {
		initialKey = new Key('initial key');
		initialValue = new Value('initial value');
		testMap = new UpsertableWeakMap([[initialKey, initialValue]]);
	});

	afterEach(() => {
		testMap = null;
	});

	describe('preservation of native functionality', () => {
		it('gets a value which is already present', () => {
			const actual = testMap?.get(initialKey);

			expect(actual).toEqual(initialValue);
		});

		it('assigns a value to an unassigned key', () => {
			const key = new Key('unassigned key');
			const value = new Value('value');

			testMap?.set(key, value);

			const actual = testMap?.get(key);

			expect(actual).toEqual(value);
		});

		it('assigns a new value to an existing key', () => {
			const value = new Value('new value');

			testMap?.set(initialKey, value);

			const actual = testMap?.get(initialKey);

			expect(actual).toEqual(value);
		});
	});

	describe('usperting values', () => {
		it('upserts a value if not present', () => {
			const key = new Key('upsert key');
			const value = new Value('upsert value');

			testMap?.upsert(key, () => value);

			const actual = testMap?.get(key);

			expect(actual).toEqual(value);
		});

		it('returns the value which was upserted', () => {
			const key = new Key('upsert key');
			const value = new Value('upsert value');

			const actual = testMap?.upsert(key, () => value);

			expect(actual).toEqual(value);
		});

		it('produces an upserted value from the key being assigned', () => {
			const upsertingKey = new Key('upserting');

			const actual = testMap?.upsert(upsertingKey, (key) => {
				const uppsercase = key.key.toUpperCase();

				return new Value(uppsercase);
			});

			expect(actual?.value).toEqual('UPSERTING');
		});

		it('preserves a value which was already set', () => {
			const unassignedValue = new Value('not set');

			testMap?.upsert(initialKey, () => unassignedValue);

			const actual = testMap?.get(initialKey);

			expect(actual).toEqual(initialValue);
		});

		it('returns the previously set value when upserting to key which is already set', () => {
			const unassignedValue = new Value('not set');

			const actual = testMap?.upsert(initialKey, () => unassignedValue);

			expect(actual).toEqual(initialValue);
		});
	});

	describe('nullish values', () => {
		type NullishTestValue = Value | null | undefined;

		let nullishTestMap: UpsertableWeakMap<Key, NullishTestValue> | null = null;
		let initialNullValueKey!: Key;
		let initialUndefinedValueKey!: Key;

		beforeEach(() => {
			initialNullValueKey = new Key('key to initial null value');
			initialUndefinedValueKey = new Key('key to initial undefined value');
			nullishTestMap = new UpsertableWeakMap([
				[initialKey, initialValue],
				[initialNullValueKey, null],
				[initialUndefinedValueKey, undefined],
			]);
		});

		afterEach(() => {
			nullishTestMap = null;
		});

		it('gets a null value', () => {
			const actual = nullishTestMap?.get(initialNullValueKey);

			expect(actual).toBeNull();
		});

		it('sets a null value', () => {
			nullishTestMap?.set(initialKey, null);

			const actual = nullishTestMap?.get(initialKey);

			expect(actual).toBeNull();
		});

		it('gets an undefined value', () => {
			const actual = nullishTestMap?.get(initialUndefinedValueKey);

			expect(actual).toBeUndefined();
		});

		it('sets an undefined value', () => {
			nullishTestMap?.set(initialKey, undefined);

			const actual = nullishTestMap?.get(initialKey);

			expect(actual).toBeUndefined();
		});

		it('preserves an existing null value', () => {
			const unassignedValue = new Value('not set');

			const upserted = nullishTestMap?.upsert(initialNullValueKey, () => unassignedValue);
			const actual = nullishTestMap?.get(initialNullValueKey);

			expect(upserted).toBe(actual);
			expect(actual).toBeNull();
		});

		it('preserves an existing undefined value', () => {
			const unassignedValue = new Value('not set');

			const upserted = nullishTestMap?.upsert(initialUndefinedValueKey, () => unassignedValue);
			const actual = nullishTestMap?.get(initialUndefinedValueKey);

			expect(upserted).toBe(actual);
			expect(actual).toBeUndefined();
		});
	});
});
