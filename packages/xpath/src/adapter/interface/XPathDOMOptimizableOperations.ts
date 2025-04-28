import type { XPathNode } from './XPathNode.ts';
import type {
	AdapterChildNode,
	AdapterDocument,
	AdapterElement,
	AdapterParentNode,
} from './XPathNodeKindAdapter.ts';

export interface XPathDOMOptimizableOperations<T extends XPathNode> {
	readonly getElementByUniqueId: (node: AdapterDocument<T>, id: string) => AdapterElement<T> | null;

	readonly getQualifiedNamedAttributeValue: (
		node: AdapterElement<T>,
		namespaceURI: string | null,
		localName: string
	) => string | null;

	readonly getLocalNamedAttributeValue: (
		node: AdapterElement<T>,
		localName: string
	) => string | null;

	readonly hasLocalNamedAttribute: (node: AdapterElement<T>, localName: string) => boolean;

	readonly getChildrenByLocalName: (
		node: AdapterParentNode<T>,
		localName: string
	) => ReadonlyArray<AdapterElement<T>>;

	readonly getFirstChildNode: (node: T) => AdapterChildNode<T> | null;
	readonly getFirstChildElement: (node: T) => AdapterElement<T> | null;
	readonly getLastChildNode: (node: T) => AdapterChildNode<T> | null;
	readonly getLastChildElement: (node: T) => AdapterElement<T> | null;
}
