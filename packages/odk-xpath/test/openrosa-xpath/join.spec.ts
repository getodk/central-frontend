import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('#join()', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should join a list of strings with supplied separator', () => {
		testContext = createTestContext(`
      <root>
        <item>one</item>
        <item>two</item>
        <item>three</item>
      </root>`);

		testContext.assertStringValue('join(" :: ", //item)', 'one :: two :: three');
	});

	it('should join list of strings', () => {
		testContext.assertStringValue(
			'join(" ", "This", "is", "a", "sentence.")',
			'This is a sentence.'
		);
		testContext.assertStringValue('join(" ## ")', '');
	});

	it('should join nodes', () => {
		testContext = createTestContext(`
        <root id='xroot'>
          <item>1</item>
          <item>2</item>
          <item>3</item>
          <item>4</item>
        </root>`);

		testContext.assertStringValue('join(", ", //item)', '1, 2, 3, 4');
		testContext.assertStringValue('join(", ", /root/*)', '1, 2, 3, 4');

		const contextNode = testContext.document.getElementById('xroot');

		testContext.assertStringValue('join(", ", *)', '1, 2, 3, 4', {
			contextNode,
		});
	});
});
