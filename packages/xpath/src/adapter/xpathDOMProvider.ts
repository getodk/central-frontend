import type { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import { filter } from '../lib/iterators/common.ts';
import type { XPathDOMAdapter } from './interface/XPathDOMAdapter.ts';
import type { XPathDOMOptimizableOperations } from './interface/XPathDOMOptimizableOperations.ts';
import type { XPathNode } from './interface/XPathNode.ts';
import type {
	AdapterAttribute,
	AdapterChildNode,
	AdapterComment,
	AdapterDocument,
	AdapterElement,
	AdapterNamespaceDeclaration,
	AdapterParentNode,
	AdapterProcessingInstruction,
	AdapterQualifiedNamedNode,
	AdapterText,
	XPathNodeKindAdapter,
} from './interface/XPathNodeKindAdapter.ts';

type AssertXPathNode<T extends XPathNode> = <U>(
	value: U,
	message?: string
) => asserts value is Extract<U, T>;

type AssertParentNode<T extends XPathNode> = <U>(
	value: U,
	message?: string
) => asserts value is Extract<U, AdapterParentNode<T>>;

type NodeKindPredicate<T extends XPathNode, U extends T> = (node: T) => node is U;

/**
 * Provides frequently used type guards for narrowing an
 * {@link XPathDOMAdapter}'s node representation to either:
 *
 * - A valid context node (as provided to evaluation API call sites)
 * - Any one distinct semantic kind of XPath node
 * - Useful unions of any subset thereof
 */
interface NodeKindGuards<T extends XPathNode> {
	readonly assertXPathNode: AssertXPathNode<T>;
	readonly assertParentNode: AssertParentNode<T>;
	readonly isDocument: NodeKindPredicate<T, AdapterDocument<T>>;
	readonly isElement: NodeKindPredicate<T, AdapterElement<T>>;
	readonly isNamespaceDeclaration: NodeKindPredicate<T, AdapterNamespaceDeclaration<T>>;
	readonly isAttribute: NodeKindPredicate<T, AdapterAttribute<T>>;
	readonly isText: NodeKindPredicate<T, AdapterText<T>>;
	readonly isComment: NodeKindPredicate<T, AdapterComment<T>>;
	readonly isProcessingInstruction: NodeKindPredicate<T, AdapterProcessingInstruction<T>>;
	readonly isParentNode: NodeKindPredicate<T, AdapterParentNode<T>>;
	readonly isQualifiedNamedNode: NodeKindPredicate<T, AdapterQualifiedNamedNode<T>>;
}

interface ExtendedNodeKindGuards<T extends XPathNode>
	extends XPathDOMAdapter<T>,
		NodeKindGuards<T> {}

/**
 * Derives frequently used {@link NodeKindGuards | node kind predicates}
 * from an {@link XPathDOMAdapter}'s
 * {@link XPathNodeKindAdapter.getNodeKind | getNodeKind} implementation.
 */
const extendNodeKindGuards = <T extends XPathNode>(
	base: XPathDOMAdapter<T>
): ExtendedNodeKindGuards<T> => {
	const assertXPathNode: AssertXPathNode<T> = (value, message = 'Invalid context node') => {
		if (!base.isXPathNode(value)) {
			throw new Error(message);
		}
	};

	const isParentNode: NodeKindPredicate<T, AdapterParentNode<T>> = (
		value: T
	): value is AdapterParentNode<T> => {
		const kind = base.getNodeKind(value);

		return kind === 'document' || kind === 'element';
	};

	const extensions: NodeKindGuards<T> = {
		assertXPathNode,
		assertParentNode: (value, message = 'Invalid parent node') => {
			assertXPathNode(value);

			if (!isParentNode(value)) {
				throw new Error(message);
			}
		},
		isDocument: (node: T): node is AdapterDocument<T> => {
			return base.getNodeKind(node) === 'document';
		},
		isElement: (node): node is AdapterElement<T> => {
			return base.getNodeKind(node) === 'element';
		},
		isNamespaceDeclaration: (node): node is AdapterNamespaceDeclaration<T> => {
			return base.getNodeKind(node) === 'namespace_declaration';
		},
		isAttribute: (node): node is AdapterAttribute<T> => {
			return base.getNodeKind(node) === 'attribute';
		},
		isText: (node): node is AdapterText<T> => {
			return base.getNodeKind(node) === 'text';
		},
		isComment: (node): node is AdapterComment<T> => {
			return base.getNodeKind(node) === 'comment';
		},
		isProcessingInstruction: (node): node is AdapterProcessingInstruction<T> => {
			return base.getNodeKind(node) === 'processing_instruction';
		},
		isParentNode,
		isQualifiedNamedNode: (node): node is AdapterQualifiedNamedNode<T> => {
			const kind = base.getNodeKind(node);

			return kind === 'element' || kind === 'attribute';
		},
	};

	return Object.assign(base, extensions);
};

type IterableNodeFilter<T extends XPathNode, U extends T> = (nodes: Iterable<T>) => Iterable<U>;

/**
 * Provides frequently used operations, such as filtering and sorting, on
 * {@link Iterable} sequences of an {@link XPathDOMAdapter}'s node
 * representation.
 */
interface IterableOperations<T extends XPathNode> {
	readonly filterAttributes: IterableNodeFilter<T, AdapterAttribute<T>>;
	readonly filterQualifiedNamedNodes: IterableNodeFilter<T, AdapterQualifiedNamedNode<T>>;
	readonly filterComments: IterableNodeFilter<T, AdapterComment<T>>;
	readonly filterNamespaceDeclarations: IterableNodeFilter<T, AdapterNamespaceDeclaration<T>>;
	readonly filterProcessingInstructions: IterableNodeFilter<T, AdapterProcessingInstruction<T>>;
	readonly filterTextNodes: IterableNodeFilter<T, AdapterText<T>>;

	// Note: iterable -> array is intentional. Can't sort a lazy, arbitrary-order
	// sequence without iterating every item!
	readonly sortInDocumentOrder: (nodes: Iterable<T>) => readonly T[];
}

interface ExtendedIterableOperations<T extends XPathNode>
	extends ExtendedNodeKindGuards<T>,
		IterableOperations<T> {}

/**
 * Derives frequently used {@link IterableOperations | iterable operations} from an
 * {@link XPathDOMAdapter} and its derived
 * {@link NodeKindGuards | node kind predicates}.
 */
const extendIterableOperations = <T extends XPathNode>(
	base: ExtendedNodeKindGuards<T>
): ExtendedIterableOperations<T> => {
	const extensions: IterableOperations<T> = {
		filterAttributes: filter(base.isAttribute),
		filterQualifiedNamedNodes: filter(base.isQualifiedNamedNode),
		filterComments: filter(base.isComment),
		filterNamespaceDeclarations: filter(base.isNamespaceDeclaration),
		filterProcessingInstructions: filter(base.isProcessingInstruction),
		filterTextNodes: filter(base.isText),
		sortInDocumentOrder: (nodes: Iterable<T>): readonly T[] => {
			return Array.from(nodes).sort((a, b) => base.compareDocumentOrder(a, b));
		},
	};

	return Object.assign(base, extensions);
};

type UniqueIDElementLookup<T extends XPathNode> = (
	node: AdapterDocument<T>,
	id: string
) => AdapterElement<T> | null;

const getElementByUniqueIdFactory = <T extends XPathNode>(
	adapter: ExtendedNodeKindGuards<T>,
	getNamedAttributeValue: LocalNamedAttributeValueLookup<T>
): UniqueIDElementLookup<T> => {
	const adapterImplementation = adapter.getElementByUniqueId?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	function* getElementDescendants(node: AdapterParentNode<T>): Iterable<AdapterElement<T>> {
		if (adapter.isElement(node)) {
			yield node;
		}

		for (const element of adapter.getChildElements(node)) {
			yield element;

			yield* getElementDescendants(element);
		}
	}

	return (node, id) => {
		const containingDocument = adapter.getContainingDocument(node);

		for (const element of getElementDescendants(containingDocument)) {
			if (getNamedAttributeValue(element, 'id') === id) {
				return element;
			}
		}

		return null;
	};
};

type QualifiedNamedAttributeValueLookup<T extends XPathNode> = (
	node: AdapterElement<T>,
	namespaceURI: string | null,
	localName: string
) => string | null;

const getQualifiedNamedAttributeValueFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): QualifiedNamedAttributeValueLookup<T> => {
	const adapterImplementation = adapter.getQualifiedNamedAttributeValue?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node, namespaceURI, localName) => {
		const attributes = adapter.getAttributes(node);

		for (const attribute of attributes) {
			if (
				adapter.getNamespaceURI(attribute) === namespaceURI &&
				adapter.getLocalName(attribute) === localName
			) {
				return adapter.getNodeValue(attribute);
			}
		}

		return null;
	};
};

type LocalNamedAttributeValueLookup<T extends XPathNode> = (
	node: AdapterElement<T>,
	localName: string
) => string | null;

const getLocalNamedAttributeValueFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): LocalNamedAttributeValueLookup<T> => {
	const adapterImplementation = adapter.getLocalNamedAttributeValue?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node, localName) => {
		const attributes = adapter.getAttributes(node);

		for (const attribute of attributes) {
			if (adapter.getLocalName(attribute) === localName) {
				return adapter.getNodeValue(attribute);
			}
		}

		return null;
	};
};

type LocalNamedAttributePredicate<T extends XPathNode> = (
	node: AdapterElement<T>,
	localName: string
) => boolean;

const hasLocalNamedAttributeFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>,
	lookup: LocalNamedAttributeValueLookup<T>
): LocalNamedAttributePredicate<T> => {
	const adapterImplementation = adapter.hasLocalNamedAttribute?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node, localName) => {
		return lookup(node, localName) != null;
	};
};

type LocalNamedChildElementsLookup<T extends XPathNode> = (
	node: AdapterParentNode<T>,
	localName: string
) => Iterable<AdapterElement<T>>;

const getChildrenByLocalNameFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): LocalNamedChildElementsLookup<T> => {
	const adapterImplementation = adapter.getChildrenByLocalName?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node, localName) => {
		return Array.from(adapter.getChildElements(node)).filter((element) => {
			return adapter.getLocalName(element) === localName;
		});
	};
};

type ChildNodeLookup<T extends XPathNode> = (node: T) => AdapterChildNode<T> | null;

const getFirstChildNodeFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): ChildNodeLookup<T> => {
	const adapterImplementation = adapter.getFirstChildNode?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node) => {
		const [childNode] = adapter.getChildNodes(node);

		return childNode ?? null;
	};
};

const getLastChildNodeFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): ChildNodeLookup<T> => {
	const adapterImplementation = adapter.getLastChildNode?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node) => {
		return Array.from(adapter.getChildNodes(node)).at(-1) ?? null;
	};
};

type ChildElementLookup<T extends XPathNode> = (node: T) => AdapterElement<T> | null;

const getFirstChildElementFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): ChildElementLookup<T> => {
	const adapterImplementation = adapter.getFirstChildElement?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node) => {
		const [childElement] = adapter.getChildElements(node);

		return childElement ?? null;
	};
};

const getLastChildElementFactory = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): ChildElementLookup<T> => {
	const adapterImplementation = adapter.getLastChildElement?.bind(adapter);

	if (adapterImplementation != null) {
		return adapterImplementation;
	}

	return (node) => {
		return Array.from(adapter.getChildElements(node)).at(-1) ?? null;
	};
};

/**
 * Omitting XPathDOMOptimizableOperations keys here allows them to be made
 * non-optional, without then repeating the exact same properties and their
 * exact same signatures inline...
 */
type OmitOptionalOptimizableOperations<T> = Omit<T, keyof XPathDOMOptimizableOperations<XPathNode>>;

interface ExtendedOptimizableOperations<T extends XPathNode>
	extends OmitOptionalOptimizableOperations<ExtendedIterableOperations<T>>,
		XPathDOMOptimizableOperations<T> {}

/**
 * Derives concrete implementations for all of an {@link XPathDOMAdapter}'s
 * **optional** {@link XPathDOMOptimizableOperations | optimized operations}.
 *
 * For each operation:
 *
 * 1. If an implementation is provided by the adapter, that implementation will
 *    be incorporated as defined by the {@link XPathDOMProvider}.
 * 2. If the adpater does not provide an implementation of the operation, one
 *    will be derived from other aspects of the adapter's required APIs.
 */
const extendOptimizableOperations = <T extends XPathNode>(
	base: ExtendedIterableOperations<T>
): ExtendedOptimizableOperations<T> => {
	const getLocalNamedAttributeValue = getLocalNamedAttributeValueFactory(base);

	const extensions: XPathDOMOptimizableOperations<T> = {
		getElementByUniqueId: getElementByUniqueIdFactory(base, getLocalNamedAttributeValue),
		getQualifiedNamedAttributeValue: getQualifiedNamedAttributeValueFactory(base),
		getLocalNamedAttributeValue,
		hasLocalNamedAttribute: hasLocalNamedAttributeFactory(base, getLocalNamedAttributeValue),
		getChildrenByLocalName: getChildrenByLocalNameFactory(base),
		getFirstChildNode: getFirstChildNodeFactory(base),
		getFirstChildElement: getFirstChildElementFactory(base),
		getLastChildNode: getLastChildNodeFactory(base),
		getLastChildElement: getLastChildElementFactory(base),
	};

	return Object.assign(base, extensions);
};

/**
 * An {@link XPathDOMProvider} is a superset of the {@link XPathDOMAdapter}
 * interface. As such, a derived provider is assignable anywhere an adapter (or
 * subset thereof) is expected. We assign this symbol as a means to check
 * whether the adapter passed to {@link xpathDOMProvider} is already a derived
 * provider. Checking for the symbol (via {@link isXPathDOMProvider}) is
 * sufficient, because this symbol is module local and therefore is only ever
 * assigned as part of a first pass through {@link xpathDOMProvider}.
 *
 * While repeated derivation of a DOM provider is not especially likely, and
 * would probably not be particularly expensive even if it did occur, _this is
 * not just an optimization!_ A few other `@getodk/xpath` internals depend on an
 * **identity check** of a given {@link XPathDOMProvider} object as part of
 * broader guard/assertion logic.
 *
 * (An alternate approach to achieve the same thing would involve assigning both
 * the adapter and the provider as keys e.g. in an {@link UpsertableMap} cache,
 * but that would exaggerate the performance consideration, obscuring the intent
 * to preserve object identity.)
 */
const DERIVED_DOM_PROVIDER = Symbol('DERIVED_DOM_PROVIDER');

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
interface DerivedDOMProvider {
	readonly [DERIVED_DOM_PROVIDER]: true;
}

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
const derivedDOMProvider = <T>(base: T): DerivedDOMProvider & T => {
	return Object.assign({}, base, {
		[DERIVED_DOM_PROVIDER]: true as const,
	});
};

export interface XPathDOMProvider<T extends XPathNode>
	extends OmitOptionalOptimizableOperations<XPathDOMAdapter<T>>,
		NodeKindGuards<T>,
		IterableOperations<T>,
		XPathDOMOptimizableOperations<T>,
		DerivedDOMProvider {}

/**
 * @see {@link DERIVED_DOM_PROVIDER}
 */
const isXPathDOMProvider = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): adapter is XPathDOMProvider<T> => {
	return DERIVED_DOM_PROVIDER in adapter && adapter[DERIVED_DOM_PROVIDER] === true;
};

export const xpathDOMProvider = <T extends XPathNode>(
	adapter: XPathDOMAdapter<T>
): XPathDOMProvider<T> => {
	if (isXPathDOMProvider(adapter)) {
		// eslint-disable-next-line no-console
		console.warn(
			'Repeat call to xpathDOMProvider: provider has already been derived from provided adapter'
		);

		return adapter;
	}

	const extendedGuards = extendNodeKindGuards(adapter);
	const extendedIterableOperations = extendIterableOperations(extendedGuards);
	const exended = extendOptimizableOperations(extendedIterableOperations);

	return derivedDOMProvider(exended);
};
