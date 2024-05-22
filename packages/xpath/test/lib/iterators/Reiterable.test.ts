import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import { describe, expect, it } from 'vitest';
import { Reiterable } from '../../../src/lib/iterators/Reiterable.ts';

describe('Reiterable', () => {
	const sourceItems = ['a', 'b', 'c'] as const;

	type SourceItems = typeof sourceItems;

	type SourceItem = CollectionValues<SourceItems>;

	type Source = Iterable<SourceItem> | Iterator<SourceItem> | readonly SourceItem[];

	const getSourceArray = (): readonly SourceItem[] => {
		return ['a', 'b', 'c'];
	};

	const getSourceIterable = (): Iterable<SourceItem> => {
		return {
			*[Symbol.iterator]() {
				yield 'a';
				yield 'b';
				yield 'c';
			},
		};
	};

	const getSourceIterator = (): Iterator<SourceItem> => {
		const values = ['a', 'b', 'c'];

		return {
			next() {
				const value = values.shift();

				if (value == null) {
					return { done: true };
				}

				return { value };
			},
		};
	};

	describe('iterable protocol', () => {
		it("is iterable over a source array's values", () => {
			const source = getSourceArray();
			const reiterable = Reiterable.from(source);

			const results: SourceItem[] = [];

			for (const item of reiterable) {
				results.push(item);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});

		it("is iterable over a source iterable's values", () => {
			const source = getSourceIterable();
			const reiterable = Reiterable.from(source);

			const results: SourceItem[] = [];

			for (const item of reiterable) {
				results.push(item);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});

		it("is iterable over a source iterator's values", () => {
			const source = getSourceIterator();
			const reiterable = Reiterable.from(source);

			const results: SourceItem[] = [];

			for (const item of reiterable) {
				results.push(item);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});
	});

	describe('iterator protocol', () => {
		it("is an iterator of a source array's values", () => {
			const source = getSourceArray();
			const reiterable = Reiterable.from(source);
			const iterator = reiterable[Symbol.iterator]();

			const results: SourceItem[] = [];

			let next: IteratorResult<'a' | 'b' | 'c'>;

			while (!(next = iterator.next()).done) {
				results.push(next.value);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});

		it("is an iterator of a source iterable's values", () => {
			const source = getSourceIterable();
			const reiterable = Reiterable.from(source);
			const iterator = reiterable[Symbol.iterator]();

			const results: SourceItem[] = [];

			let next: IteratorResult<'a' | 'b' | 'c'>;

			while (!(next = iterator.next()).done) {
				results.push(next.value);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});

		it("is an iterator of a source iterator's values", () => {
			const source = getSourceIterator();
			const reiterable = Reiterable.from(source);
			const iterator = reiterable[Symbol.iterator]();

			const results: SourceItem[] = [];

			let next: IteratorResult<'a' | 'b' | 'c'>;

			while (!(next = iterator.next()).done) {
				results.push(next.value);
			}

			expect(results).toEqual(['a', 'b', 'c']);
		});
	});

	describe('reiterating', () => {
		type TestCaseSourceType = 'array' | 'iterable' | 'iterator';

		interface TestCase {
			readonly sourceType: TestCaseSourceType;

			source(): Source;
		}

		const cases = [
			{
				sourceType: 'array',
				source(): readonly SourceItem[] {
					return getSourceArray();
				},
			},
			{
				sourceType: 'iterable',
				source(): Iterable<SourceItem> {
					return getSourceIterable();
				},
			},
			{
				sourceType: 'iterator',
				source(): Iterator<SourceItem> {
					return getSourceIterator();
				},
			},
		] satisfies readonly TestCase[];

		it.each(cases)('is repeatedly iterable over the same $sourceType values', ({ source }) => {
			const reiterable = Reiterable.from(source());

			for (let i = 0; i < 3; i += 1) {
				const results: SourceItem[] = [];

				for (const item of reiterable) {
					results.push(item);
				}

				expect(results).toEqual(['a', 'b', 'c']);
			}
		});

		it.each(cases)(
			'repeatedly produces an iterator of the same $sourceType values',
			({ source }) => {
				const reiterable = Reiterable.from(source());

				for (let i = 0; i < 3; i += 1) {
					const iterator = reiterable[Symbol.iterator]();

					const results: SourceItem[] = [];

					let next: IteratorResult<'a' | 'b' | 'c'>;

					while (!(next = iterator.next()).done) {
						results.push(next.value);
					}

					expect(results).toEqual(['a', 'b', 'c']);
				}
			}
		);

		const exhaustIterables = (reiterable: Reiterable<SourceItem>) => {
			let count = 0;

			for (const item of reiterable) {
				count += 1;
				expect(typeof item).toBe('string');
			}

			expect(count).toEqual(3);
		};

		const exhaustIterator = (reiterable: Reiterable<SourceItem>) => {
			const iterator = reiterable[Symbol.iterator]();

			let count = 0;
			let next: IteratorResult<'a' | 'b' | 'c'>;

			while (!(next = iterator.next()).done) {
				count += 1;
				expect(typeof next.value).toBe('string');
			}

			expect(count).toEqual(3);
		};

		describe('first value', () => {
			it.each(cases)('gets the first value', ({ source }) => {
				const reiterable = Reiterable.from(source());
				const first = reiterable.first();

				expect(first).toEqual('a');
			});

			it.each(cases)('gets the first value after exhausting all iterable values', ({ source }) => {
				const reiterable = Reiterable.from(source());

				exhaustIterables(reiterable);

				const first = reiterable.first();

				expect(first).toEqual('a');
			});

			it.each(cases)('gets the first value after exhausting as an iterator', ({ source }) => {
				const reiterable = Reiterable.from(source());

				exhaustIterator(reiterable);

				const first = reiterable.first();

				expect(first).toEqual('a');
			});
		});

		describe.each(cases)('collection-like APIs with a $sourceType source', ({ source }) => {
			interface BeforeCase {
				readonly beforeDescription: string;

				before?(reiterable: Reiterable<SourceItem>): void;
			}

			const beforeCases: readonly BeforeCase[] = [
				{
					beforeDescription: '',
				},
				{
					beforeDescription: 'after exhausting as iterables',
					before: (reiterable) => {
						exhaustIterables(reiterable);
					},
				},
				{
					beforeDescription: 'after exhausting as an iterator',
					before: (reiterable) => {
						exhaustIterator(reiterable);
					},
				},
				{
					beforeDescription: 'after accessing the first item',
					before: (reiterable) => {
						const first = reiterable.first();

						expect(first).toEqual('a');
					},
				},
			];

			it.each(beforeCases)('gets the entries $beforeDescription', ({ before }) => {
				const reiterable = Reiterable.from(source());

				before?.(reiterable);

				interface Entry {
					readonly key: number;
					readonly value: SourceItem;
				}

				const results: Entry[] = [];

				for (const [key, value] of reiterable.entries()) {
					results.push({ key, value });
				}

				expect(results).toEqual([
					{ key: 0, value: 'a' },
					{ key: 1, value: 'b' },
					{ key: 2, value: 'c' },
				]);
			});

			it.each(beforeCases)('gets the keys $beforeDescription', ({ before }) => {
				const reiterable = Reiterable.from(source());

				before?.(reiterable);

				const results: number[] = [];

				for (const key of reiterable.keys()) {
					results.push(key);
				}

				expect(results).toEqual([0, 1, 2]);
			});

			it.each(beforeCases)('gets the values $beforeDescription', ({ before }) => {
				const reiterable = Reiterable.from(source());

				before?.(reiterable);

				const results: SourceItem[] = [];

				for (const value of reiterable.values()) {
					results.push(value);
				}

				expect(results).toEqual(['a', 'b', 'c']);
			});
		});

		describe.each(cases)('predicates with a $sourceType source', ({ source }) => {
			interface SomeCase {
				readonly predicateExpected: string;
				readonly expected: boolean;
			}

			const someCases: readonly SomeCase[] = [
				{
					predicateExpected: 'c',
					expected: true,
				},
				{
					predicateExpected: 'z',
					expected: false,
				},
			];

			it.each(someCases)(
				'determines that a predicate checking for some value of $predicateExpected returns $expected',
				({ predicateExpected, expected }) => {
					const reiterable = Reiterable.from(source());

					const result = reiterable.some((value) => value === predicateExpected);

					expect(result).toEqual(expected);
				}
			);

			it.each(someCases)(
				'determines that a predicate checking for some value of $predicateExpected returns $expected after exhausting all iterable values',
				({ predicateExpected, expected }) => {
					const reiterable = Reiterable.from(source());

					exhaustIterables(reiterable);

					const result = reiterable.some((value) => value === predicateExpected);

					expect(result).toEqual(expected);
				}
			);

			it.each(someCases)(
				'determines that a predicate checking for some value of $predicateExpected returns $expected after exhausting as an iterator',
				({ predicateExpected, expected }) => {
					const reiterable = Reiterable.from(source());

					exhaustIterator(reiterable);

					const result = reiterable.some((value) => value === predicateExpected);

					expect(result).toEqual(expected);
				}
			);

			it.each(someCases)(
				'determines that a predicate checking for some value of $predicateExpected returns $expected after accessing the first item',
				({ predicateExpected, expected }) => {
					const reiterable = Reiterable.from(source());
					const first = reiterable.first();

					expect(first).toEqual('a');

					const result = reiterable.some((value) => value === predicateExpected);

					expect(result).toEqual(expected);
				}
			);

			it.each(someCases)(
				'determines that a predicate checking for some value of $predicateExpected returns $expected after repeatedly accessing some or all of the items as iterables or an iterator',
				({ predicateExpected, expected }) => {
					const reiterable = Reiterable.from(source());

					reiterable.first();

					let result = reiterable.some((value) => value === predicateExpected);
					expect(result).toEqual(expected);

					exhaustIterator(reiterable);

					result = reiterable.some((value) => value === predicateExpected);
					expect(result).toEqual(expected);

					exhaustIterables(reiterable);

					result = reiterable.some((value) => value === predicateExpected);
					expect(result).toEqual(expected);

					exhaustIterables(reiterable);
					exhaustIterator(reiterable);

					result = reiterable.some((value) => value === predicateExpected);
					expect(result).toEqual(expected);
				}
			);
		});

		describe.each(cases)('predicates and reiteration of $sourceType', ({ source }) => {
			it('', () => {
				const reiterable = Reiterable.from(source());

				const someA = reiterable.some((value) => value === 'a');
				const someB = reiterable.some((value) => value === 'b');
				const someC = reiterable.some((value) => value === 'c');

				expect(someA).toEqual(true);
				expect(someB).toEqual(true);
				expect(someC).toEqual(true);
			});
		});
	});
});
