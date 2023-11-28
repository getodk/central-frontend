import { xml } from '@odk/common/test/factories/xml';
import { beforeEach, describe, expect, it } from 'vitest';
import { xpathParser } from '../../test/parser.ts';
import { Evaluator } from './Evaluator.ts';

describe('Evaluator convenience methods', () => {
	let testDocument: XMLDocument;
	let evaluator: Evaluator;

	beforeEach(() => {
		testDocument = xml`<root>
			<a>3</a>
			<b/>
			<c>
				<d>4</d>
			</c>
		</root>`;
		evaluator = new Evaluator(xpathParser, {
			rootNode: testDocument,
		});
	});

	describe('evaluateBoolean', () => {
		it.each([
			{ expression: 'true()', expected: true },
			{ expression: 'false()', expected: false },
			{ expression: '/root/a = 3', expected: true },
			{ expression: '/root/b != ""', expected: false },
		])('evaluates $expression to boolean $expected', ({ expression, expected }) => {
			const actual = evaluator.evaluateBoolean(expression);

			expect(actual).toBe(expected);
		});

		it('evaluates a boolean with an optional context node', () => {
			const c = testDocument.querySelector('c')!;
			const actual = evaluator.evaluateBoolean('./d = "4"', {
				contextNode: c,
			});

			expect(actual).toBe(true);
		});
	});

	describe('evaluateNumber', () => {
		it.each([
			{ expression: '1', expected: 1 },
			{ expression: '"2"', expected: 2 },
			{ expression: '/root/a', expected: 3 },
			{ expression: '/root/b', expected: NaN },
		])('evaluates $expression to boolean $expected', ({ expression, expected }) => {
			const actual = evaluator.evaluateNumber(expression);

			expect(actual).toBe(expected);
		});

		it('evaluates a boolean with an optional context node', () => {
			const c = testDocument.querySelector('c')!;
			const actual = evaluator.evaluateNumber('./d', {
				contextNode: c,
			});

			expect(actual).toBe(4);
		});
	});

	describe('evaluateString', () => {
		it.each([
			{ expression: '"a"', expected: 'a' },
			{ expression: '2', expected: '2' },
			{ expression: '/root/a', expected: '3' },
			{ expression: '/root/b', expected: '' },
		])('evaluates $expression to boolean $expected', ({ expression, expected }) => {
			const actual = evaluator.evaluateString(expression);

			expect(actual).toBe(expected);
		});

		it('evaluates a boolean with an optional context node', () => {
			const c = testDocument.querySelector('c')!;
			const actual = evaluator.evaluateString('./d', {
				contextNode: c,
			});

			expect(actual).toBe('4');
		});
	});
});
