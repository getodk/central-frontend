import { beforeAll, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, getNonNamespaceAttributes, namespaceResolver } from '../helpers.ts';

const getTestElement = (document: XMLDocument, id: string): Element => {
	const element = document.getElementById(id);

	expect(element, `Could not find test element with id: ${id}`).not.toBeNull();

	return element!;
};

const getTestAttributeElement = (document: XMLDocument): Element => {
	return getTestElement(document, 'testStepAxisNodeAttribute');
};

const getTestAttribute = (document: XMLDocument): Attr => {
	const element = getTestAttributeElement(document);
	const attribute = element.attributes[0];

	expect(attribute).not.toBeUndefined();

	return attribute!;
};

const getTestCDataParentElement = (document: XMLDocument): Element => {
	return getTestElement(document, 'testStepAxisNodeCData');
};

const isCDataSection = (node: Node | null): node is CDATASection =>
	node?.nodeType === Node.CDATA_SECTION_NODE;

const getTestCDataSection = (document: XMLDocument): CDATASection => {
	const { firstChild } = getTestCDataParentElement(document);

	if (isCDataSection(firstChild)) {
		return firstChild;
	}

	throw new Error('Could not find test CDataSection');
};

const getTestCommentParentElement = (document: XMLDocument): Element => {
	return getTestElement(document, 'testStepAxisNodeComment');
};

const isComment = (node: Node | null): node is Comment => node?.nodeType === Node.COMMENT_NODE;

const getTestComment = (document: XMLDocument): Comment => {
	const { firstChild } = getTestCommentParentElement(document);

	if (isComment(firstChild)) {
		return firstChild;
	}

	throw new Error('Could not find test Comment');
};

const getTestProcessingInstructionParentElement = (document: XMLDocument): Element => {
	return getTestElement(document, 'testStepAxisNodeProcessingInstruction');
};

const isProcessingInstruction = (node: Node | null): node is ProcessingInstruction =>
	node?.nodeType === Node.PROCESSING_INSTRUCTION_NODE;

const getTestProcessingInstruction = (document: XMLDocument): ProcessingInstruction => {
	const { firstChild } = getTestProcessingInstructionParentElement(document);

	if (isProcessingInstruction(firstChild)) {
		return firstChild;
	}

	throw new Error('Could not find test Comment');
};

const getDescendantNodes = (node: Node): readonly Node[] => {
	return Array.from(node.childNodes).flatMap((childNode) => [
		childNode,
		...getDescendantNodes(childNode),
	]);
};

const getFollowingSiblings = (node: Node): readonly Node[] => {
	const nodes: Node[] = [];

	let sibling: Node | null = node;

	while ((sibling = sibling.nextSibling) != null) {
		nodes.push(sibling);
	}

	return nodes;
};

const getPrecedingSiblings = (node: Node): readonly Node[] => {
	const nodes: Node[] = [];

	let sibling: Node | null = node;

	while ((sibling = sibling.previousSibling) != null) {
		nodes.push(sibling);
	}

	return nodes;
};

const getAllDocumentNodes = (document: XMLDocument): readonly Node[] => {
	const treeWalker = document.createTreeWalker(document);
	const nodes: Node[] = [];

	do {
		const { currentNode } = treeWalker;

		nodes.push(currentNode);
	} while (treeWalker.nextNode() != null);

	return nodes;
};

// TODO: previously this explicitly filtered out the `DocumentType` (if any).
// It shouldn't ever actually be in the results, but making a note in case it
// had some meaningful purpose.
const getFollowingNodes = (document: XMLDocument, node: Node): readonly Node[] => {
	return getAllDocumentNodes(document).filter((item) => {
		const position = node.compareDocumentPosition(item);

		return position === Node.DOCUMENT_POSITION_FOLLOWING;
	});
};

const getPrecedingNodes = (document: XMLDocument, node: Node): readonly Node[] => {
	return getAllDocumentNodes(document).filter((item) => {
		const position = node.compareDocumentPosition(item);

		return position === Node.DOCUMENT_POSITION_PRECEDING;
	});
};

describe('axis', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeAll(() => {
		testContext = createTestContext(
			`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="StepAxisCase">

            <div id="testStepAxisNodeElement"></div>
            <div id="testStepAxisNodeAttribute" style="sss:asdf;" width="100%"></div>
            <div id="testStepAxisNodeCData"><![CDATA[aa<strong>some text</strong>]]><div></div>asdf</div>
            <div id="testStepAxisNodeComment"><!-- here is comment --><div></div>asdf</div>
            <div id="testStepAxisNodeProcessingInstruction"><?xml-stylesheet type="text/xml" href="test.xsl"?><div></div>asdf</div>
            <div id="testStepAxisNodeNamespace" xmlns:asdf="http://some-namespace/" width="100%"></div>

            <div id="testStepAxisChild">
              some text
              <![CDATA[aa<strong>some text</strong>]]>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            <div id="testStepAxisDescendant">
              <div>
                <div></div>
                <div></div>
                <div></div>
                <div>
                  <div></div>
                  <div></div>
                  <!-- here is comment -->
                </div>
              </div>
              <div></div>
            </div>

            <div id="testStepAxisAttribute">
              <div id="testStepAxisNodeAttribute0"></div>
              <div id="testStepAxisNodeAttribute1" class="test 123"></div>
              <div id="testStepAxisNodeAttribute3" style="aaa" class="test 123" width="100%"></div>
              <div id="testStepAxisNodeAttributeStartXml" xmlnswidth="100%" xml="sss"></div>

              <div id="testStepAxisNodeNamespace0"></div>
              <div id="testStepAxisNodeNamespace1" xmlns:a="asdf"></div>
              <div id="testStepAxisNodeNamespace1b" xmlns:a="asdf"></div>
              <div id="testStepAxisNodeNamespace1defaultContainer"><div xmlns="asdf"></div></div>
              <div id="testStepAxisNodeNamespace1defaultContainer2"><div xmlns=""></div></div>
              <div id="testStepAxisNodeNamespace3" xmlns:a="asdf" xmlns:b="asdf2" xmlns:c="asdf3"></div>
              <div id="testStepAxisNodeNamespace3defaultContainer"><div xmlns:a="asdf" xmlns="asdf2" xmlns:c="asdf3"></div></div>
              <div id="testStepAxisNodeNamespaceXmlOverride" xmlns:ev="http://some-other-namespace/"></div>

              <div id="testStepAxisNodeAttrib1Ns1" class="test 123" xmlns:a="asdf"></div>
              <div id="testStepAxisNodeAttrib1Ns1reversed" xmlns:a="asdf" class="test 123"></div>
              <div id="testStepAxisNodeAttrib2Ns1" style="aaa" class="test 123" xmlns:c="asdf3"></div>
              <div id="testStepAxisNodeAttrib2Ns1reversedContainer"><div style="aaa" xmlns="asdf" class="test 123"></div></div>
              <div id="testStepAxisNodeAttrib2Ns2Container"><div xmlns:a="asdf" xmlns="asdf2" style="aaa" class="test 123"></div></div>
            </div>
          </div>
        </body>
      </html>`,
			{ namespaceResolver }
		);
		document = testContext.document;
	});

	describe('self axis', () => {
		it('works with document context', () => {
			testContext.assertNodeSet('self::node()', [document]);
		});

		it('works with documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet('self::node()', [document.documentElement], {
				contextNode,
			});
		});

		it('works with element context', () => {
			const contextNode = document.getElementById('testStepAxisChild')!;

			testContext.assertNodeSet('self::node()', [document.getElementById('testStepAxisChild')!], {
				contextNode,
			});
		});

		it('works with element attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with CData context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with node processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('self::node()', [contextNode], {
				contextNode,
			});
		});

		it.fails('works with document fragment context', () => {
			const contextNode = document.createDocumentFragment();

			testContext.evaluate('self::node()', contextNode);
		});
	});

	describe('child axis', () => {
		it('works with document context', () => {
			let i;
			const expectedResult = [];

			for (i = 0; i < document.childNodes.length; i++) {
				expectedResult.push(document.childNodes.item(i));
			}

			testContext.assertNodeSet('child::node()', expectedResult);
		});

		it('works with documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet('child::node()', Array.from(document.documentElement.childNodes), {
				contextNode,
			});
		});

		it('works with element context', () => {
			const contextNode = document.getElementById('testStepAxisChild')!;

			testContext.assertNodeSet('child::node()', Array.from(contextNode.childNodes), {
				contextNode,
			});
		});

		it('works with attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('child::node()', [], {
				contextNode,
			});
		});

		it('works with CData context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('child::node()', [], {
				contextNode,
			});
		});

		it('works with a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('child::node()', [], {
				contextNode,
			});
		});

		it('works with a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('child::node()', [], {
				contextNode,
			});
		});
	});

	describe('descendant axis', () => {
		it('works with Element context', () => {
			const contextNode = document.getElementById('testStepAxisDescendant')!;

			testContext.assertNodeSet('descendant::node()', getDescendantNodes(contextNode), {
				contextNode,
			});
		});

		it('works with attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('descendant::node()', [], {
				contextNode,
			});
		});

		it('works with CData context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('descendant::node()', [], {
				contextNode,
			});
		});

		it('works with a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('descendant::node()', [], {
				contextNode,
			});
		});

		it('works with a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('descendant::node()', [], {
				contextNode,
			});
		});
	});

	describe('descendant-or-self axis', () => {
		it('works with element context', () => {
			const contextNode = document.getElementById('testStepAxisDescendant')!;

			const nodes = [contextNode, ...getDescendantNodes(contextNode)];

			testContext.assertNodeSet('descendant-or-self::node()', nodes, {
				contextNode,
			});
		});

		it('works with attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('descendant-or-self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('descendant-or-self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('descendant-or-self::node()', [contextNode], {
				contextNode,
			});
		});

		it('works with element context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('descendant-or-self::node()', [contextNode], {
				contextNode,
			});
		});
	});

	describe('parent axis', () => {
		it('works with a document context', () => {
			testContext.assertNodeSet('parent::node()', []);
		});

		it('works with a documentElement context', () => {
			const contextNode = document.documentElement;

			// console.log('test ctx', contextNode)

			testContext.assertNodeSet('parent::node()', [document], {
				contextNode,
			});
		});

		it('works with an element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement');

			testContext.assertNodeSet('parent::node()', [document.getElementById('StepAxisCase')!], {
				contextNode,
			});
		});

		it('works with an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet(
				'parent::node()',
				[document.getElementById('testStepAxisNodeAttribute')!],
				{
					contextNode,
				}
			);
		});

		it('works with a CData context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('parent::node()', [getTestCDataParentElement(document)], {
				contextNode,
			});
		});

		it('works with a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('parent::node()', [getTestCommentParentElement(document)], {
				contextNode,
			});
		});

		it('works with a processing instruction', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet(
				'parent::node()',
				[getTestProcessingInstructionParentElement(document)],
				{
					contextNode,
				}
			);
		});
	});

	describe('ancestor axis', () => {
		it('works for a cocument context', () => {
			testContext.assertNodeSet('ancestor::node()', []);
		});

		it('works for a documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet('ancestor::node()', [document], {
				contextNode,
			});
		});

		it('works for an element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement');

			testContext.assertNodeSet(
				'ancestor::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
				],
				{
					contextNode,
				}
			);
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet(
				'ancestor::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeAttribute')!,
				],
				{
					contextNode,
				}
			);
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet(
				'ancestor::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeCData')!,
				],
				{
					contextNode,
				}
			);
		});

		it('works for a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet(
				'ancestor::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeComment')!,
				],
				{
					contextNode,
				}
			);
		});

		it('works for a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet(
				'ancestor::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeProcessingInstruction')!,
				],
				{
					contextNode,
				}
			);
		});
	});

	describe('ancestor-or-self axis', () => {
		it('works for document context', () => {
			testContext.assertNodeSet('ancestor-or-self::node()', [document]);
		});

		it('works for documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet('ancestor-or-self::node()', [document, document.documentElement], {
				contextNode,
			});
		});

		it('works for an element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement');

			testContext.assertNodeSet(
				'ancestor-or-self::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeElement')!,
				],
				{
					contextNode,
				}
			);
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet(
				'ancestor-or-self::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeAttribute')!,
					contextNode,
				],
				{
					contextNode,
				}
			);
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet(
				'ancestor-or-self::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeCData')!,
					contextNode,
				],
				{
					contextNode,
				}
			);
		});

		it('works for a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet(
				'ancestor-or-self::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeComment')!,
					contextNode,
				],
				{
					contextNode,
				}
			);
		});

		it('works for processingInstruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet(
				'ancestor-or-self::node()',
				[
					document,
					document.documentElement,
					document.querySelector('body')!,
					document.getElementById('StepAxisCase')!,
					document.getElementById('testStepAxisNodeProcessingInstruction')!,
					contextNode,
				],
				{
					contextNode,
				}
			);
		});
	});

	describe('following-sibling axis', () => {
		it('works for a document context', () => {
			testContext.assertNodeSet('following-sibling::node()', []);
		});

		it('works for a documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet(
				'following-sibling::node()',
				getFollowingSiblings(document.documentElement),
				{
					contextNode,
				}
			);
		});

		it('works for an element: context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement')!;

			testContext.assertNodeSet('following-sibling::node()', getFollowingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('following-sibling::node()', [], {
				contextNode,
			});
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('following-sibling::node()', getFollowingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('following-sibling::node()', getFollowingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for a processing instruction', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('following-sibling::node()', getFollowingSiblings(contextNode), {
				contextNode,
			});
		});
	});

	describe('preceding-sibling axis', () => {
		it('works for a document context', () => {
			testContext.assertNodeSet('preceding-sibling::node()', []);
		});

		it('works for a documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet(
				'preceding-sibling::node()',
				getPrecedingSiblings(document.documentElement),
				{
					contextNode,
				}
			);
		});

		it('works for a Element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement')!;

			testContext.assertNodeSet('preceding-sibling::node()', getPrecedingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for a Attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('preceding-sibling::node()', [], {
				contextNode,
			});
		});

		it('works for a CData context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('preceding-sibling::node()', getPrecedingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for a Comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('preceding-sibling::node()', getPrecedingSiblings(contextNode), {
				contextNode,
			});
		});

		it('works for a ProcessingInstruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('preceding-sibling::node()', getPrecedingSiblings(contextNode), {
				contextNode,
			});
		});
	});

	describe('following axis', () => {
		it('works for a document context', () => {
			testContext.assertNodeSet('following::node()', []);
		});

		it('works for a documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet(
				'following::node()',
				getFollowingNodes(document, document.documentElement),
				{
					contextNode,
				}
			);
		});

		it('works for an element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement')!;

			testContext.assertNodeSet('following::node()', getFollowingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet(
				'following::node()',
				getFollowingNodes(document, document.getElementById('testStepAxisNodeAttribute')!),
				{
					contextNode,
				}
			);
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('following::node()', getFollowingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('following::node()', getFollowingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('following::node()', getFollowingNodes(document, contextNode), {
				contextNode,
			});
		});
	});

	describe('preceding axis', () => {
		it('works for a document context', () => {
			testContext.assertNodeSet('preceding::node()', []);
		});

		it('works for a documentElement context', () => {
			const contextNode = document.documentElement;

			testContext.assertNodeSet(
				'preceding::node()',
				getPrecedingNodes(document, document.documentElement),
				{
					contextNode,
				}
			);
		});

		it('works for an element context', () => {
			const contextNode = document.getElementById('testStepAxisNodeElement')!;

			testContext.assertNodeSet('preceding::node()', getPrecedingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet(
				'preceding::node()',
				getPrecedingNodes(document, document.getElementById('testStepAxisNodeAttribute')!),
				{
					contextNode,
				}
			);
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('preceding::node()', getPrecedingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for a Comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('preceding::node()', getPrecedingNodes(document, contextNode), {
				contextNode,
			});
		});

		it('works for a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('preceding::node()', getPrecedingNodes(document, contextNode), {
				contextNode,
			});
		});
	});

	describe('attribute axis', () => {
		it('works for a document context', () => {
			testContext.assertNodeSet('attribute::node()', []);
		});

		it('works for an attribute context', () => {
			const contextNode = getTestAttribute(document);

			testContext.assertNodeSet('attribute::node()', [], {
				contextNode,
			});
		});

		it('works for a CDATA context', () => {
			const contextNode = getTestCDataSection(document);

			testContext.assertNodeSet('attribute::node()', [], {
				contextNode,
			});
		});

		it('works for a comment context', () => {
			const contextNode = getTestComment(document);

			testContext.assertNodeSet('attribute::node()', [], {
				contextNode,
			});
		});

		it('works for a processing instruction context', () => {
			const contextNode = getTestProcessingInstruction(document);

			testContext.assertNodeSet('attribute::node()', [], {
				contextNode,
			});
		});

		it('works for a 0 context', () => {
			const contextNode = document.getElementById('testStepAxisNodeAttribute0')!;

			testContext.assertNodeSet('attribute::node()', getNonNamespaceAttributes(contextNode), {
				contextNode,
			});
		});

		it('works for a 1 context', () => {
			const contextNode = document.getElementById('testStepAxisNodeAttribute1')!;

			testContext.assertNodeSet('attribute::node()', getNonNamespaceAttributes(contextNode), {
				contextNode,
			});
		});

		it('works for a 3: context', () => {
			const contextNode = document.getElementById('testStepAxisNodeAttribute3')!;

			testContext.assertNodeSet('attribute::node()', getNonNamespaceAttributes(contextNode), {
				contextNode,
			});
		});

		it('works for a StartXml context', () => {
			const contextNode = document.getElementById('testStepAxisNodeAttributeStartXml')!;

			testContext.assertNodeSet('attribute::node()', getNonNamespaceAttributes(contextNode), {
				contextNode,
			});
		});
	});
});
