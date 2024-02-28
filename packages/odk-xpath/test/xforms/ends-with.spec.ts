import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('ends-with', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('ends-with', () => {
		testContext.assertBooleanValue('ends-with("", "")', true);
		testContext.assertBooleanValue('ends-with("a", "")', true);
		testContext.assertBooleanValue('ends-with("a", "a")', true);
		testContext.assertBooleanValue('ends-with("a", "b")', false);
		testContext.assertBooleanValue('ends-with("ba", "a")', true);
		testContext.assertBooleanValue('ends-with("", "b")', false);
	});

	it.fails('ends-with() fails when too many arguments are provided', () => {
		testContext.evaluate('ends-with(1, 2, 3)');
	});

	[{ expression: 'ends-with()' }, { expression: 'ends-with(1)' }].forEach(({ expression }) => {
		it.fails(`${expression} fails when not enough arguments are provided`, () => {
			testContext.evaluate(expression);
		});
	});

	it('with a node parameter', () => {
		testContext = createXFormsTestContext(`
      <data>
        <a id="A">TAXIcab</a>
      </data>`);

		testContext.assertBooleanValue('ends-with( /data/a, "cab")', true);
	});
});
