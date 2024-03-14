import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('nodeset id() function', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <div id="FunctionNodesetIdCase">
        <div id="FunctionNodesetIdCaseSimple"></div>
        <div id="FunctionNodesetIdCaseNoDefaultNamespaceContainer"><div id="FunctionNodesetIdCaseNoDefaultNamespace" xmlns=""></div></div>
        <div id="FunctionNodesetIdCaseXhtmlDefaultNamespaceContainer"><div id="FunctionNodesetIdCaseXhtmlDefaultNamespace" xmlns="http://www.w3.org/1999/xhtml"></div></div>
        <div id="FunctionNodesetIdCaseXhtmlNamespaceContainer"><div xhtml:id="FunctionNodesetIdCaseXhtmlNamespace" xmlns:xhtml="http://www.w3.org/1999/xhtml"></div></div>
        <div id="FunctionNodesetIdCaseXhtmlNamespaceParentContainer" xmlns:xhtml="http://www.w3.org/1999/xhtml"><div xhtml:id="FunctionNodesetIdCaseXhtmlNamespaceParent"></div></div>
        <div id="FunctionNodesetIdXmlNamespaceContainer"><div xml:id="FunctionNodesetIdXmlNamespace" xmlns=""></div></div>

        <div>
          <div id="FunctionNodesetIdCaseMultiple1"></div>
          <div id="FunctionNodesetIdCaseMultiple2"></div>
          <div id="FunctionNodesetIdCaseMultiple3"></div>
          <div id="FunctionNodesetIdCaseMultiple4"></div>
        </div>

        <div id="FunctionNodesetIdCaseNodeset"><p>FunctionNodesetIdCaseMultiple2</p><p>FunctionNodesetIdCaseMultiple1</p><p>FunctionNodesetIdCaseMultiple2 FunctionNodesetIdCaseMultiple4</p><p>FunctionNodesetIdCaseMultiple3</p></div>
      </div>`);
		document = testContext.document;
	});

	it('works for a simple case', () => {
		const expected = document.getElementById('FunctionNodesetIdCaseSimple')!;

		testContext.assertNodeSet("id('FunctionNodesetIdCaseSimple')", [expected]);
	});

	it('works if ID is provided in duplicate', () => {
		const expected = document.getElementById('FunctionNodesetIdCaseSimple');

		testContext.assertNodeSet("id('FunctionNodesetIdCaseSimple FunctionNodesetIdCaseSimple')", [
			expected!,
		]);
	});

	it('returns empty result for non-existing ID', () => {
		testContext.assertNodeSet("id('FunctionNodesetIdCaseSimpleDoesNotExist')", []);
	});

	// TODO: the browser behavior described here seems correct, the test seems wrong?
	//TODO Browsers still return the node for this scenario when the nodes namespace is empty (xmlns='')
	it.skip('returns empty result if the default namespace for the node is empty', () => {
		const contextNode = document.getElementById(
			'FunctionNodesetIdCaseNoDefaultNamespaceContainer'
		)!.firstChild!;

		testContext.assertNodeSet("id('FunctionNodesetIdCaseNoDefaultNamespace')", [], {
			contextNode,
		});
	});

	it('works if the default namespace for the node is the XHTML namespace', () => {
		const expected = document.getElementById(
			'FunctionNodesetIdCaseXhtmlDefaultNamespaceContainer'
		)!.firstChild!;

		testContext.assertNodeSet("id('FunctionNodesetIdCaseXhtmlDefaultNamespace')", [expected]);
	});

	// TODO: again the browser behavior seems expected. `id(...)` is specifically
	// shorthand for `[@id = ...]`.
	// Browsers do not return anything in this case
	it.skip('works if the namespace of the id attribute is the XHTML namespace', () => {
		const expected = document.getElementById(
			'FunctionNodesetIdCaseXhtmlNamespaceContainer'
		)!.firstChild!;

		testContext.assertNodeSet("id('FunctionNodesetIdCaseXhtmlNamespace')", [expected]);
	});

	// TODO: browser behavior again seems correct. The child element in question
	// again has a namespaced `id` attribute.
	// Browsers do not return anything in this case
	it.skip('works if the namespace of the id attribute is defined in the parent container', () => {
		const expected = document.getElementById(
			'FunctionNodesetIdCaseXhtmlNamespaceParentContainer'
		)!.firstChild!;

		testContext.assertNodeSet("id('FunctionNodesetIdCaseXhtmlNamespaceParent')", [expected]);
	});

	// TODO: once again, browser behavior seems correct, namespaced id attribute.
	// Browsers do not return anything in this case
	it.skip('works if the id attribute has the xml namespace alias', () => {
		const expected = document.getElementById('FunctionNodesetIdXmlNamespaceContainer')!.firstChild!;

		testContext.assertNodeSet("id('FunctionNodesetIdXmlNamespace')", [expected]);
	});

	it('works if multiple space-separated IDs are provided as the parameter', () => {
		testContext.assertNodeSet(
			"id('FunctionNodesetIdCaseMultiple1 FunctionNodesetIdCaseMultiple2 FunctionNodesetIdCaseMultiple3')",
			[
				document.getElementById('FunctionNodesetIdCaseMultiple1')!,
				document.getElementById('FunctionNodesetIdCaseMultiple2')!,
				document.getElementById('FunctionNodesetIdCaseMultiple3')!,
			]
		);
	});

	it('works if multiple space/newline/table-separated IDs are provided as the parameter', () => {
		testContext.assertNodeSet(
			"id('  FunctionNodesetIdCaseMultiple1 sss FunctionNodesetIdCaseMultiple2\r\n\tFunctionNodesetIdCaseMultiple3\t')",
			[
				document.getElementById('FunctionNodesetIdCaseMultiple1')!,
				document.getElementById('FunctionNodesetIdCaseMultiple2')!,
				document.getElementById('FunctionNodesetIdCaseMultiple3')!,
			]
		);
	});

	it('works if a nodeset is provided as the argument (by using the content of the nodeset)', () => {
		let contextNode = document.getElementById('FunctionNodesetIdCaseNodeset')!;

		testContext.assertNodeSet('id(.)', [], {
			contextNode,
		});

		// TODO: this is the second of two tests!
		// TODO: may be better to clarify this second test as testing a union of the
		// nodeset, i.e. it is equivalent to `id(child1 | child2 | child3 | child4)`.
		// this test is tricky, the argument is the CONTENT of the FunctionNodesetIdCaseNodeset element!
		contextNode = document.getElementById('FunctionNodesetIdCaseNodeset')!;

		testContext.assertNodeSet(
			'id(child::*)',
			[
				document.getElementById('FunctionNodesetIdCaseMultiple1')!,
				document.getElementById('FunctionNodesetIdCaseMultiple2')!,
				document.getElementById('FunctionNodesetIdCaseMultiple3')!,
				document.getElementById('FunctionNodesetIdCaseMultiple4')!,
			],
			{
				contextNode,
			}
		);
	});
});
