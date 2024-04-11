import { describe, expect, it } from 'vitest';
import { insertAtIndex } from '../../../src/lib/array/insert.ts';

describe('Array insertion', () => {
	describe('at a specified index', () => {
		it.each([
			{ currentValues: [0, 1, 2], value: 3, insertionIndex: 3, expected: [0, 1, 2, 3] },
			{ currentValues: [0, 1, 2], value: 3, insertionIndex: 1, expected: [0, 3, 1, 2] },
		])(
			'produces an array $expected with the inserted value $value at the specified index $insertionIndex',
			({ currentValues, value, insertionIndex, expected }) => {
				const result = insertAtIndex(currentValues, insertionIndex, value);

				expect(result).toEqual(expected);
			}
		);

		it("fails to insert a value at an index past the array's current length", () => {
			const fn = () => {
				insertAtIndex([0, 1, 2], 4, 3);
			};

			expect(fn).toThrow();
		});
	});
});
