import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('lang functions', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-US" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <body class="yui3-skin-sam" id="body">
          <div id="testLang" xml:lang="pt-BR">
            <div lang="fr">
              <div id="testLang2"></div>
            </div>
            <div id="testLang3" xml:lang="sl"></div>
            <div id="testLang4"></div>
          </div>
        </body>
      </html>
    `);
	});

	it('lang()', () => {
		const contextNode = testContext.document.documentElement;

		testContext.assertBooleanValue("lang('en')", true, {
			contextNode,
		});
		testContext.assertBooleanValue("lang('EN')", true, {
			contextNode,
		});
		testContext.assertBooleanValue("lang('EN-us')", true, {
			contextNode,
		});
		testContext.assertBooleanValue("lang('EN-us-boont')", false, {
			contextNode,
		});
	});

	describe('hierarchy check', () => {
		it('should work on nodes', () => {
			let contextNode: Element = testContext.document.querySelector('body')!;

			testContext.assertBooleanValue("lang('EN')", true, {
				contextNode,
			});

			contextNode = testContext.document.getElementById('testLang2')!;

			testContext.assertBooleanValue("lang('pt')", true, {
				contextNode,
			});
			testContext.assertBooleanValue("lang('pt-BR')", true, {
				contextNode,
			});
			testContext.assertBooleanValue("lang('fr')", false, {
				contextNode,
			});

			contextNode = testContext.document.getElementById('testLang3')!;

			testContext.assertBooleanValue("lang('sl')", true, {
				contextNode,
			});
		});
	});

	it.fails('lang() fails when too few arguments are provided', () => {
		testContext.evaluate('lang()');
	});

	it.fails('lang() fails when too many arguments are provided', () => {
		testContext.evaluate('lang(1, 2)');
	});
});
