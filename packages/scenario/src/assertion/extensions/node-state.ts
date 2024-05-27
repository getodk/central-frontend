import type { DeriveStaticVitestExpectExtension } from '@getodk/common/test/assertions/helpers.ts';
import {
	extendExpect,
	StaticConditionExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import type { AnyNode, RootNode } from '@getodk/xforms-engine';
import { expect } from 'vitest';

type UnknownObject = Record<PropertyKey, unknown>;

type AssertUnknownObject = (value: unknown) => asserts value is UnknownObject;

const assertUnknownObject: AssertUnknownObject = (value) => {
	if (typeof value !== 'object' || value == null) {
		throw new Error('Not an object');
	}
};

type AssertRootNode = (node: unknown) => asserts node is RootNode;

const assertRootNode: AssertRootNode = (node) => {
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

const assertEngineNode: AssertEngineNode = (node) => {
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

const nodeStateExtensions = extendExpect(expect, {
	toBeRelevant: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { relevant: true },
	}),
	toBeNonRelevant: new StaticConditionExpectExtension(assertEngineNode, {
		currentState: { relevant: false },
	}),
});

type NodeStateExtensions = typeof nodeStateExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<NodeStateExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<NodeStateExtensions> {}
}
