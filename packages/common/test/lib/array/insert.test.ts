import { describe, expect, it } from 'vitest';
import { insertAtIndex } from '../../../src/lib/array/insert.ts';

describe('Array insertion', () => {
	describe('at a specified index', () => {
		it.each([
			{ currentValues: [0, 1, 2], values: [3, 4], insertionIndex: 3, expected: [0, 1, 2, 3, 4] },
			{ currentValues: [0, 1, 2], values: [3, 4], insertionIndex: 1, expected: [0, 3, 4, 1, 2] },
		])(
			'produces an array $expected with the inserted values $values at the specified index $insertionIndex',
			({ currentValues, values, insertionIndex, expected }) => {
				const result = insertAtIndex(currentValues, insertionIndex, values);

				expect(result).toEqual(expected);
			}
		);

		it("fails to insert values at an index past the array's current length", () => {
			const fn = () => {
				insertAtIndex([0, 1, 2], 4, [3]);
			};

			expect(fn).toThrow();
		});
	});
});
