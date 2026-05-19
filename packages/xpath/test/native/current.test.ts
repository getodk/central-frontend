import { beforeEach, describe, it } from 'vitest';
import { createTestContext, type TestContext } from '../helpers.ts';

describe('current()', () => {
	let testContext: TestContext;

	interface CurrentTestContextNodes {
		readonly document: XMLDocument;
		readonly outer: Element;
		readonly inner: Element;
		readonly a: Element;
		readonly b: Element;
		readonly c: Element;
		readonly d: Attr;
	}

	let contextNodes: CurrentTestContextNodes;

	beforeEach(() => {
		testContext = createTestContext(/* xml */ `
			<outer>
				<inner>
					<a>1</a>
					<b>
						<c d="e">3</c>
					</b>
				</inner>
			</outer>
		`);

		const { document } = testContext;
		const outer = document.querySelector('outer')!;
		const inner = document.querySelector('inner')!;
		const a = document.querySelector('a')!;
		const b = document.querySelector('b')!;
		const c = document.querySelector('c')!;
		const d = c.getAttributeNode('d')!;

		contextNodes = {
			document,
			outer,
			inner,
			a,
			b,
			c,
			d,
		};
	});

	interface CurrentSelfCase {
		readonly contextNodeKey: keyof CurrentTestContextNodes;
	}

	it.each<CurrentSelfCase>([
		{ contextNodeKey: 'document' },
		{ contextNodeKey: 'outer' },
		{ contextNodeKey: 'inner' },
		{ contextNodeKey: 'a' },
		{ contextNodeKey: 'b' },
		{ contextNodeKey: 'c' },
		{ contextNodeKey: 'd' },
	])(
		'gets the current context node ($contextNodeKey) as a direct expression',
		({ contextNodeKey }) => {
			const contextNode = contextNodes[contextNodeKey];

			testContext.assertNodeSet('current()', [contextNode], {
				contextNode,
			});
		}
	);

	interface CurrentDescendantCase {
		readonly expression: string;
		readonly expectedNodeKeys: ReadonlyArray<keyof CurrentTestContextNodes>;
		readonly contextNodeKey: keyof CurrentTestContextNodes;
	}

	it.each<CurrentDescendantCase>([
		{
			contextNodeKey: 'document',
			expectedNodeKeys: ['outer'],
			expression: 'current()/outer',
		},
		{
			contextNodeKey: 'inner',
			expectedNodeKeys: ['a', 'b', 'c'],
			expression: 'current()//*',
		},
		{
			contextNodeKey: 'c',
			expectedNodeKeys: ['d'],
			expression: 'current()/@*',
		},
		{
			contextNodeKey: 'b',
			expectedNodeKeys: ['d'],
			expression: 'current()/*/@d',
		},
	])(
		'gets a node-set result descending from the current context node',
		({ contextNodeKey, expectedNodeKeys, expression }) => {
			const contextNode = contextNodes[contextNodeKey];
			const expected = expectedNodeKeys.map((key) => contextNodes[key]);

			testContext.assertNodeSet(expression, expected, {
				contextNode,
			});
		}
	);
});
