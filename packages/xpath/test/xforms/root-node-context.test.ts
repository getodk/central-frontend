import { ScopedElementLookup } from '@getodk/common/lib/dom/compatibility.ts';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { xml } from '@getodk/common/test/factories/xml.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Evaluator } from '../../src/index.ts';

describe("Specifying an Evaluator's root node", () => {
	const DEPTH_3_TEXT = 'text node in element at depth 3, in the first nested root';
	const DEPTH_2_TEXT = 'text node in an element at depth 2, in the second nested root';

	let testDocument: XMLDocument;

	beforeEach(() => {
		testDocument = xml`<doc-root>
			<depth-1-0>
				<depth-2>
					<depth-3>${DEPTH_3_TEXT}</depth-3>
					<arbitrary-node />
				</depth-2>
			</depth-1-0>
			<depth-1-1>
				<depth-2>${DEPTH_2_TEXT}</depth-2>
			</depth-1-1>
		</doc-root>`;
	});

	const contextTypeCases = [
		{ contextType: 'arbitrary' },
		{ contextType: 'document' },
		{ contextType: 'root' },
	] as const;

	describe.each(contextTypeCases)('with a $contextType context', ({ contextType }) => {
		interface AbsoluteCase {
			readonly rootNodeSelector: string | null;
			readonly expression: string;
			readonly expected: string;
		}

		const absoluteCases: readonly AbsoluteCase[] = [
			{
				rootNodeSelector: null,
				expression: '/doc-root/depth-1-0/depth-2/depth-3',
				expected: DEPTH_3_TEXT,
			},
			{
				rootNodeSelector: 'doc-root',
				expression: '/depth-1-0/depth-2/depth-3',
				expected: DEPTH_3_TEXT,
			},
			{
				rootNodeSelector: 'depth-2',
				expression: '/depth-3',
				expected: DEPTH_3_TEXT,
			},
			{
				rootNodeSelector: 'depth-1-1',
				expression: '/depth-2',
				expected: DEPTH_2_TEXT,
			},
		];

		it.each(absoluteCases)(
			'evaluates $expression from the root node with selector $selector to $expected',
			({ expression, rootNodeSelector, expected }) => {
				const rootNode =
					rootNodeSelector == null ? null : testDocument.querySelector(rootNodeSelector)!;

				const evaluator = new Evaluator({
					rootNode,
				});

				let contextNode: Node;

				switch (contextType) {
					case 'document':
						contextNode = testDocument;
						break;

					case 'root':
						contextNode = rootNode ?? testDocument;
						break;

					case 'arbitrary':
						contextNode = testDocument.querySelector('arbitrary-node')!;
						break;

					default:
						throw new UnreachableError(contextType);
				}

				const { stringValue } = evaluator.evaluate(
					expression,
					contextNode,
					null,
					XPathResult.STRING_TYPE
				);

				expect(stringValue).toEqual(expected);
			}
		);

		interface IsolationCase {
			readonly rootNodeSelector: string | null;
			readonly expression: string;
			readonly expectedNodeSelector: string | null;
		}

		const isolationCases: readonly IsolationCase[] = [
			{
				rootNodeSelector: null,
				expression: '..',
				expectedNodeSelector: null,
			},
			{
				rootNodeSelector: 'doc-root',
				expression: '..',
				expectedNodeSelector: null,
			},
			{
				rootNodeSelector: 'depth-1-0 depth-2',
				expression: '/..',
				expectedNodeSelector: null,
			},
			{
				rootNodeSelector: 'depth-1-0 depth-2',
				expression: '../..',
				expectedNodeSelector: null,
			},
			{
				rootNodeSelector: 'depth-1-0 depth-2',
				expression: '//depth-1/*',
				expectedNodeSelector: null,
			},
			{
				rootNodeSelector: 'depth-1-0 depth-2',
				expression: '//depth-1//*',
				expectedNodeSelector: null,
			},
		];

		it.each(isolationCases)(
			'evaluates $expression from the root node with selector $selector to null',
			({ expression, rootNodeSelector, expectedNodeSelector }) => {
				const rootNode =
					rootNodeSelector == null ? null : testDocument.querySelector(rootNodeSelector);
				const evaluator = new Evaluator({
					rootNode,
				});
				const { singleNodeValue: actual } = evaluator.evaluate(
					expression,
					rootNode ?? testDocument,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				);
				const expected =
					expectedNodeSelector == null ? null : testDocument.querySelector(expectedNodeSelector)!;

				expect(actual).toEqual(expected);
			}
		);
	});

	describe('XForms root node (example)', () => {
		const EXAMPLE_NAMESPACE = 'http://example.com';

		const xformDocument = xml`<?xml version="1.0" encoding="utf-8"?>
			<h:html
				xmlns="http://www.w3.org/2002/xforms"
				xmlns:ev="http://www.w3.org/2001/xml-events"
				xmlns:h="http://www.w3.org/1999/xhtml"
				xmlns:jr="http://openrosa.org/javarosa"
				xmlns:orx="http://openrosa.org/xforms"
				xmlns:xsd="http://www.w3.org/2001/XMLSchema"
				xmlns:example="${EXAMPLE_NAMESPACE}">
				<h:head>
					<h:title>Example XForm</h:title>
					<model>
						<instance>
							<root id="example-xform">
								<first/>
								<second>
									<third third-attr="" />
								</second>
								<meta>
									<instanceID/>
								</meta>
							</root>
						</instance>

						<bind nodeset="/root/first" example:expect-selector="first" />
						<bind nodeset="/root/second" example:expect-selector="second" />
						<bind nodeset="/root/second/third/@third-attr" example:expect-attribute="third-attr" />
					</model>
				</h:head>
				<h:body>
				</h:body>
			</h:html>`;
		const binds = Array.from(xformDocument.querySelectorAll('bind'));

		it('tests 3 binds (check setup assumptions)', () => {
			expect(binds.length).toEqual(3);
		});

		const bindCases = binds.map((bind, index) => ({
			bind,
			index,
		}));
		const instanceLookup = new ScopedElementLookup(':scope > instance', 'instance');

		it.each(bindCases)(
			'gets the model node for the nodeset defined on the bind at index $index',
			({ bind }) => {
				const modelElement = xformDocument.querySelector(':root > head > model')!;
				const primaryInstanceElement = instanceLookup.getElement(modelElement)!;
				const evaluator = new Evaluator({
					rootNode: primaryInstanceElement,
				});

				const nodeset = bind.getAttribute('nodeset')!;
				const { singleNodeValue: actual } = evaluator.evaluate(
					nodeset,
					xformDocument,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				);

				const expectedSelector = bind.getAttributeNS(EXAMPLE_NAMESPACE, 'expect-selector');
				const expectedAttribute = bind.getAttributeNS(EXAMPLE_NAMESPACE, 'expect-attribute');

				let expected: Node | null = null;

				if (expectedSelector != null) {
					expected = primaryInstanceElement.querySelector(`:scope ${expectedSelector}`)!;
				}

				if (expectedAttribute != null) {
					expected = primaryInstanceElement
						.querySelector(`:scope [${expectedAttribute}]`)!
						.getAttributeNode(expectedAttribute)!;
				}

				if (expected == null) {
					throw new Error(`Invalid test case for bind ${bind.outerHTML}`);
				}

				expect(actual).toEqual(expected);
			}
		);
	});
});
