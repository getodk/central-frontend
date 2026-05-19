import { bench, describe } from 'vitest';

describe('first', () => {
	bench('1000', () => {
		for (let i = 0; i < 1000; i += 1) {
			const array = Array(i).fill(null);

			array.forEach((_, j) => {
				if (j < 0) {
					throw new Error('welp');
				}
			});
		}
	});

	bench('10_000', () => {
		for (let i = 0; i < 10_000; i += 1) {
			const array = Array(i).fill(null);

			array.forEach((_, j) => {
				if (j < 0) {
					throw new Error('welp');
				}
			});
		}
	});
});

describe('other', () => {
	bench('5000', () => {
		for (let i = 0; i < 5000; i += 1) {
			const array = Array(i).fill(null);

			array.forEach((_, j) => {
				if (j < 0) {
					throw new Error('welp');
				}
			});
		}
	});

	bench('5001', () => {
		for (let i = 0; i < 5001; i += 1) {
			const array = Array(i).fill(null);

			array.forEach((_, j) => {
				if (j < 0) {
					throw new Error('welp');
				}
			});
		}
	});
});
