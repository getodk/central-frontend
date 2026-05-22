import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('Attribute context nodes', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext(/* xml */ `
      <model>
        <instance>
          <data>
            <q1 q1attr="">q1 value</q1>
            <q2 q2attr="">2</q2>
            <q3 q3attr="">q3 value</q3>
            <q4 q4attr="3">4</q4>
          </data>
        </instance>
        <instance id="secondary1">
          <data>
            <item1 item1attr="">item value</item1>
            <item2 item2attr="">5</item2>
          </data>
        </instance>
        <instance id="secondary2">
          <model>
            <instance unusual="">But testing it just in case!</instance>
          </model>
        </instance>
      </model>
    `);
	});

	const getAttr = (attrName: string) =>
		testContext.evaluate(`//@${attrName}`, null, XPathResult.FIRST_ORDERED_NODE_TYPE)
			.singleNodeValue;

	it('evaluates an absolute nodeset value from a primary instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('q1attr');

		testContext.assertStringValue('/model/instance[1]/data/q1', 'q1 value', {
			contextNode,
		});
	});

	it('evaluates an absolute nodeset subexpression from a primary instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('q2attr');

		testContext.assertNumberValue(' ( /model/instance[1]/data/q2 * 2 ) ', 4, {
			contextNode,
		});
	});

	it('evaluates an absolute nodeset value from any instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('q1attr');

		testContext.assertStringValue('/model/instance/data/q1', 'q1 value', {
			contextNode,
		});
	});

	it('evaluates an absolute nodeset subexpression from any instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('q2attr');

		testContext.assertNumberValue(' ( /model/instance/data/q2 * 2 ) ', 4, {
			contextNode,
		});
	});

	it('evaluates a relative nodeset value when providing an attribute as the context node', () => {
		const contextNode = getAttr('q3attr');

		testContext.assertStringValue(' .. ', 'q3 value', {
			contextNode,
		});
	});

	it('evaluates a relative nodeset value when providing an attribute as the context node', () => {
		const contextNode = getAttr('q4attr');

		testContext.assertNumberValue(' 4 * .. ', 16, {
			contextNode,
		});
	});

	it('evaluates an absolute nodeset value from a secondary instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('item1attr');

		testContext.assertStringValue(
			' /model/instance[ @id = "secondary1" ]/data/item1',
			'item value',
			{
				contextNode,
			}
		);
	});

	it('evaluates an absolute nodeset subexpression from a secondary instance when providing an attribute as the context node', () => {
		const contextNode = getAttr('item2attr');

		testContext.assertNumberValue(
			' ( /model/instance[ @id = "secondary1" ]/data/item2 * 5 ) ',
			25,
			{
				contextNode,
			}
		);
	});

	it('evaluates an absolute nodeset value from a nodeset path with nested model/instance elements', () => {
		const contextNode = getAttr('unusual');

		testContext.assertStringValue(
			' /model/instance[ @id = "secondary2" ]/model/instance',
			'But testing it just in case!',
			{
				contextNode,
			}
		);
	});

	it('evaluates an absolute nodeset referencing a wildcard node', () => {
		const contextNode = getAttr('q1attr');

		testContext.assertStringValue('/*/*/*/*', 'q1 value', {
			contextNode,
		});
	});

	it('evaluates a descendant nodeset', () => {
		const contextNode = getAttr('q1attr');

		testContext.assertStringValue('//q1', 'q1 value', {
			contextNode,
		});
	});
});
