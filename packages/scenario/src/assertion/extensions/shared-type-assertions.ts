import { assertUnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import { arrayOfAssertion } from '@getodk/common/test/assertions/arrayOfAssertion.ts';
import type { TypeofAssertion } from '@getodk/common/test/assertions/typeofAssertion.ts';
import { typeofAssertion } from '@getodk/common/test/assertions/typeofAssertion.ts';
import type { AnyNode, RootNode } from '@getodk/xforms-engine';

type AssertRootNode = (node: unknown) => asserts node is RootNode;

export const assertRootNode: AssertRootNode = (node) => {
	assertUnknownObject(node);

	const maybeRootNode = node as Partial<RootNode>;

	if (
		maybeRootNode.nodeType !== 'root' ||
		typeof maybeRootNode.setLanguage !== 'function' ||
		typeof maybeRootNode.currentState !== 'object' ||
		maybeRootNode.currentState == null
	) {
		throw new Error('Node is not a `RootNode`');
	}
};

type AssertEngineNode = (node: unknown) => asserts node is AnyNode;

type AnyNodeType = AnyNode['nodeType'];
type NonRootNodeType = Exclude<AnyNodeType, 'root'>;

const nonRootNodeTypes = new Set<NonRootNodeType>([
	'string',
	'select',
	'subtree',
	'group',
	'repeat-range',
	'repeat-instance',
]);

export const assertEngineNode: AssertEngineNode = (node) => {
	assertUnknownObject(node);

	const maybeNode = node as Partial<AnyNode>;

	assertRootNode(maybeNode.root);

	if (maybeNode === maybeNode.root) {
		return;
	}

	if (!nonRootNodeTypes.has(maybeNode.nodeType as NonRootNodeType)) {
		throw new Error('Not an engine node');
	}
};

export const assertString: TypeofAssertion<'string'> = typeofAssertion('string');

type AssertNullableString = (value: unknown) => asserts value is string | null | undefined;

export const assertNullableString: AssertNullableString = (value) => {
	if (value != null) {
		assertString(value);
	}
};

export const assertArrayOfStrings = arrayOfAssertion(assertString, 'string');
