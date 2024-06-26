import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('node-type', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <div id="StepNodeTestNodeTypeCase">
        some text
        <div></div>
        <div>
          <div></div>
        </div>
        <!-- comment --><!-- comment -->
        asdf
        asdfsdf sdf
        <div></div>
        <?xml-stylesheet type="text/xml" href="test.xsl"?>
        <div></div>
        sdfsdf
        <![CDATA[aa<strong>some text</strong>]]>
        <!-- comment -->
        <div></div>
        <?custom-process-instruct type="text/xml" href="test.xsl"?>
        <div></div>
      </div>`);
		document = testContext.document;
	});

	it('"node" is supported', () => {
		const contextNode = document.getElementById('StepNodeTestNodeTypeCase');

		testContext.assertNodeSet('child::node()', [...contextNode!.childNodes], {
			contextNode,
		});
	});

	it('"text" is supported', () => {
		const contextNode = document.getElementById('StepNodeTestNodeTypeCase')!;
		const expected = [...contextNode.childNodes].filter(
			(node): node is CDATASection | Text =>
				node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.TEXT_NODE
		);

		testContext.assertNodeSet('child::text()', expected, {
			contextNode,
		});
	});

	it('"comment" is supported', () => {
		const contextNode = document.getElementById('StepNodeTestNodeTypeCase')!;
		const expected = [...contextNode.childNodes].filter(
			(node): node is Comment => node.nodeType === Node.COMMENT_NODE
		);

		testContext.assertNodeSet('child::comment()', expected, {
			contextNode,
		});
	});

	it('"processing-instruction any" is supported', () => {
		const contextNode = document.getElementById('StepNodeTestNodeTypeCase')!;
		const expected = [...contextNode.childNodes].filter(
			(node): node is ProcessingInstruction => node.nodeType === Node.PROCESSING_INSTRUCTION_NODE
		);

		testContext.assertNodeSet('child::processing-instruction()', expected, {
			contextNode,
		});
	});

	it('"processing-instruction specific" is supported', () => {
		const contextNode = document.getElementById('StepNodeTestNodeTypeCase')!;
		const expected = [...contextNode.childNodes].filter(
			(node): node is ProcessingInstruction & { readonly nodeName: 'custom-process-instruct' } =>
				node.nodeType === Node.PROCESSING_INSTRUCTION_NODE &&
				node.nodeName === 'custom-process-instruct'
		);

		testContext.assertNodeSet(
			"child::processing-instruction('custom-process-instruct')",
			expected,
			{
				contextNode,
			}
		);
	});
});
