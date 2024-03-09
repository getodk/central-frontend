type LookupNamespaceURI = (prefix: string | null) => string | null;

export interface XPathNamespaceResolverObject {
	readonly lookupNamespaceURI: LookupNamespaceURI;
}

export type XPathNSResolver = LookupNamespaceURI | XPathNamespaceResolverObject;

interface XPathResultStatic {
	readonly ANY_TYPE: 0;
	readonly NUMBER_TYPE: 1;
	readonly STRING_TYPE: 2;
	readonly BOOLEAN_TYPE: 3;
	readonly UNORDERED_NODE_ITERATOR_TYPE: 4;
	readonly ORDERED_NODE_ITERATOR_TYPE: 5;
	readonly UNORDERED_NODE_SNAPSHOT_TYPE: 6;
	readonly ORDERED_NODE_SNAPSHOT_TYPE: 7;
	readonly ANY_UNORDERED_NODE_TYPE: 8;
	readonly FIRST_ORDERED_NODE_TYPE: 9;
}

export type XPathResultType = XPathResultStatic[keyof XPathResultStatic];

export interface XPathResult extends XPathResultStatic {
	readonly booleanValue: boolean;
	readonly invalidIteratorState: boolean;
	readonly numberValue: number;
	readonly resultType: XPathResultType;
	readonly singleNodeValue: Node | null;
	readonly snapshotLength: number;
	readonly stringValue: string;

	iterateNext(): Node | null;
	snapshotItem(index: number): Node | null;
}

export interface AnyXPathEvaluator {
	evaluate(
		expression: string,
		contextNode: Node,
		namespaceResolver: XPathNSResolver | null,
		resultType: XPathResultType | null
	): XPathResult;
}
