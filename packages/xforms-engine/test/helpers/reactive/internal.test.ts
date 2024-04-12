import { describe, expect, it } from 'vitest';
import { reactiveTestScope } from './internal.ts';

describe('Internal minimal reactivity implementation (itself currently for use in tests)', () => {
	it('creates an object with the same shape and property values', () => {
		expect.assertions(1);

		reactiveTestScope(({ mutable }) => {
			const object = mutable({
				a: 'a',
				b: 1,
			});

			expect(object).toEqual({
				a: 'a',
				b: 1,
			});
		});
	});

	it('subscribes to mutations when reading a property within an effect', () => {
		expect.assertions(2);

		reactiveTestScope(({ mutable, effect }) => {
			const object = mutable({
				a: 'a',
				b: 1,
			});

			let effectReactions = 0;

			effect(() => {
				effectReactions += 1;

				object.a;
			});

			expect(effectReactions).toBe(1);

			object.a = 'c';

			expect(effectReactions).toBe(2);
		});
	});

	it('does not subscribe to mutations affecting properties unread within an effect', () => {
		expect.assertions(3);

		reactiveTestScope(({ mutable, effect }) => {
			const object = mutable({
				a: 'a',
				b: 1,
			});

			let effectReactions = 0;

			effect(() => {
				effectReactions += 1;

				object.a;
			});

			expect(effectReactions).toBe(1);

			object.b = 2;

			expect(effectReactions).toBe(1);

			object.b = 3;

			expect(effectReactions).toBe(1);
		});
	});

	it('does not subscribe to mutations independently across effects, depending on which property values are read', () => {
		expect.assertions(3);

		reactiveTestScope(({ mutable, effect }) => {
			const object = mutable({
				a: 'a',
				b: 1,
			});

			const effectReactions = {
				a: 0,
				b: 0,
			};

			effect(() => {
				effectReactions.a += 1;

				object.a;
			});

			effect(() => {
				effectReactions.b += 1;

				object.b;
			});

			expect(effectReactions).toStrictEqual({
				a: 1,
				b: 1,
			});

			object.b = 2;
			object.b = 3;

			expect(effectReactions).toStrictEqual({
				a: 1,
				b: 3,
			});

			object.a = 'b';

			expect(effectReactions).toStrictEqual({
				a: 2,
				b: 3,
			});
		});
	});

	it('subscribes to computed mutations when reading the computation within an effect', () => {
		expect.assertions(1);

		reactiveTestScope(({ mutable, computed, effect }) => {
			const object = mutable({
				a: 'a',
				b: 1,
			});

			const serialized = computed(() => {
				return `a: "${object.a}", b: ${object.b}`;
			});

			const tracked: string[] = [];

			effect(() => {
				tracked.push(serialized());
			});

			object.a = 'b';
			object.b = 2;
			object.a = 'c';

			expect(tracked).toStrictEqual([
				'a: "a", b: 1',
				'a: "b", b: 1',
				'a: "b", b: 2',
				'a: "c", b: 2',
			]);
		});
	});

	it('preserves access to getters in the provided object', () => {
		expect.assertions(1);

		reactiveTestScope(({ mutable }) => {
			const object = mutable({
				a: 'a',
				get b() {
					return `this is b, the current value of a is "${this.a}"`;
				},
			});

			expect(object).toEqual({
				a: 'a',
				b: 'this is b, the current value of a is "a"',
			});
		});
	});

	it('subscribes to mutations affecting a getter which is read within an effect', () => {
		expect.assertions(2);

		reactiveTestScope(({ mutable, effect }) => {
			const object = mutable({
				a: 'a',
				get b() {
					return `this is b, the current value of a is "${this.a}"`;
				},
			});

			let effectReactions = 0;

			effect(() => {
				effectReactions += 1;

				object.b;
			});

			expect(effectReactions).toBe(1);

			object.a = 'z';

			expect(effectReactions).toBe(2);
		});
	});

	it("returns an arbitrary value produced by the reactive scope's callback", () => {
		const result = reactiveTestScope(() => {
			return 'I am arbitrary';
		});

		expect(result).toBe('I am arbitrary');
	});
});
