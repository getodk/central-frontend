import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('once()', () => {
	let testContext: XFormsTestContext;
	let contextNode: Element | null;

	beforeEach(() => {
		testContext = createXFormsTestContext(`
      <div id="FunctionSelectedCase">
        <div id="FunctionSelectedCaseEmpty"></div>
        <div id="FunctionSelectedCaseSingle">ab</div>
        <div id="FunctionSelectedCaseMultiple">ab cd ef gh</div>
        <div id="FunctionSelectedCaseMultiple">ij</div>
      </div>`);
	});

	describe('evaluates when context node is empty', () => {
		beforeEach(() => {
			contextNode = testContext.document.getElementById('FunctionSelectedCaseEmpty');
		});

		it('should set value to a string', () => {
			testContext.assertStringValue('once("aa")', 'aa', {
				contextNode,
			});
		});

		it('should set value to NaN', () => {
			testContext.assertStringValue('once(. * 10)', 'NaN', {
				contextNode,
			});
		});

		it('should set value to Inifity', () => {
			testContext.assertStringValue('once(1 div 0)', 'Infinity', {
				contextNode,
			});
		});
	});

	it('does not evaluate when context node is not empty, but returns current value', () => {
		contextNode = testContext.document.getElementById('FunctionSelectedCaseSingle');

		testContext.assertStringValue('once("aa")', 'ab', {
			contextNode,
		});
	});
});
