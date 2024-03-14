import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext, createXFormsTextContentTestContext } from '../helpers.ts';

describe('#coalesce()', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should return first value if provided via xpath', () => {
		testContext = createXFormsTextContentTestContext('first');

		testContext.assertStringValue('coalesce(/simple/xpath/to/node, "whatever")', 'first');
	});

	it('should return first value if provided via string', () => {
		testContext.assertStringValue('coalesce("FIRST", "whatever")', 'FIRST');
	});

	it('should return second value from xpath if first value is empty string', () => {
		testContext = createXFormsTextContentTestContext('second');

		testContext.assertStringValue('coalesce("", /simple/xpath/to/node)', 'second');
	});

	it('should return second value from string if first value is empty string', () => {
		testContext.assertStringValue('coalesce("", "SECOND")', 'SECOND');
		testContext.assertStringValue("coalesce('', 'ab')", 'ab');
	});

	it('should return second value from xpath if first value is empty xpath', () => {
		testContext = createXFormsTextContentTestContext('second');

		testContext.assertStringValue('coalesce(/simple/empty, /simple/xpath/to/node)', 'second');
	});

	it('should return second value from string if first value is empty xpath', () => {
		testContext.assertStringValue('coalesce(/simple/xpath/to/node, "SECOND")', 'SECOND');
	});

	it('coalesce(self::*)', () => {
		testContext = createXFormsTestContext(`
      <div id="FunctionSelectedCase">
        <div id="FunctionSelectedCaseEmpty"></div>
        <div id="FunctionSelectedCaseSingle">ab</div>
        <div id="FunctionSelectedCaseMultiple">ab cd ef gh</div>
        <div id="FunctionSelectedCaseMultiple">ij</div>
      </div>`);

		let contextNode = testContext.document.getElementById('FunctionSelectedCaseEmpty');

		testContext.assertStringValue("coalesce(self::*, 'ab')", 'ab', {
			contextNode,
		});

		contextNode = testContext.document.getElementById('FunctionSelectedCaseSingle');

		testContext.assertStringValue("coalesce(self::*, 'cd')", 'ab', {
			contextNode,
		});
	});
});
