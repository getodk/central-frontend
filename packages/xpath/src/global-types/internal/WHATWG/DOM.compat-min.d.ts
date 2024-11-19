interface NodeList {
	readonly length: number;
}

interface NodeListOf<TNode extends Node> extends NodeList {
	[Symbol.iterator](): ArrayIterator<TNode>;
}

interface Node {
	readonly childNodes: NodeListOf<ChildNode>;
	readonly firstChild: ChildNode | null;
	readonly lastChild: ChildNode | null;
	readonly nextSibling: ChildNode | null;
	readonly nodeName: string;
	readonly nodeType: number;
	readonly ownerDocument: Document | null;
	readonly parentElement: Element | null;
	readonly parentNode: ParentNode | null;
	readonly previousSibling: ChildNode | null;
	readonly textContent: string | null;

	readonly ELEMENT_NODE: 1;
	readonly ATTRIBUTE_NODE: 2;
	readonly TEXT_NODE: 3;
	readonly CDATA_SECTION_NODE: 4;
	readonly ENTITY_REFERENCE_NODE: 5;
	readonly ENTITY_NODE: 6;
	readonly PROCESSING_INSTRUCTION_NODE: 7;
	readonly COMMENT_NODE: 8;
	readonly DOCUMENT_NODE: 9;
	readonly DOCUMENT_TYPE_NODE: 10;
	readonly DOCUMENT_FRAGMENT_NODE: 11;
	readonly NOTATION_NODE: 12;
	readonly DOCUMENT_POSITION_DISCONNECTED: 0x01;
	readonly DOCUMENT_POSITION_PRECEDING: 0x02;
	readonly DOCUMENT_POSITION_FOLLOWING: 0x04;
	readonly DOCUMENT_POSITION_CONTAINS: 0x08;
	readonly DOCUMENT_POSITION_CONTAINED_BY: 0x10;
	readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 0x20;

	compareDocumentPosition(other: Node): number;
	contains(other: Node | null): boolean;
	getRootNode(): Node;
	lookupNamespaceURI(prefix: string | null): string | null;
}

interface ChildNode extends Node {
	/**
	 * Note: this deviates from the equivalent type in TypeScript's DOM lib! That
	 * `ChildNode` interface includes **only** methods, all of which perform state
	 * changes, either on the child node itself or on nodes related to it. In
	 * order to disambiguate {@link ChildNode} usage from any other {@link Node},
	 * we must include **some** aspect of the interface which is compatible with
	 * TypeScript's DOM lib.
	 *
	 * While we **SHOULD NOT** perform any observable state changes in the
	 * evaluation of XPath expressions, including a definition for such a state
	 * changing method is somewhat error prone: its presence suggests it _is
	 * expected to be used_! (Which it is, but only as a type distinguishing
	 * mechanism.)
	 *
	 * By defining the method signature with `this: never`, we accomplish these
	 * two goals (which are otherwise difficult to reconcile):
	 *
	 * 1. Attempts to actuall call the method within `@getodk/xpath` will produce
	 *    a type error.
	 * 2. The type is assignable to (and therefore compatible with) TypeScript's
	 *    DOM lib, because `never` is assignable to everything.
	 *
	 * @todo ensure that we do not actually produce this type in build products!
	 */
	remove(this: never): void;
}

interface NonDocumentTypeChildNode {
	/**
	 * Returns the first following sibling that is an element, and null otherwise.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CharacterData/nextElementSibling)
	 */
	readonly nextElementSibling: Element | null;
	/**
	 * Returns the first preceding sibling that is an element, and null otherwise.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CharacterData/previousElementSibling)
	 */
	readonly previousElementSibling: Element | null;
}

interface HTMLCollectionBase {
	readonly [index: number]: Element;
	[Symbol.iterator](): ArrayIterator<Element>;
}

interface HTMLCollection extends HTMLCollectionBase {}

interface ParentNode extends Node {
	readonly documentElement?: Element;

	readonly children: HTMLCollection;
	readonly firstElementChild: Element | null;
	readonly lastElementChild: Element | null;
}

interface Document extends Node, ParentNode {
	readonly documentElement: Element;
	readonly ownerDocument: null;

	getElementById(elementId: string): Element | null;
}

interface NamedNodeMap {
	readonly [index: number]: Attr;
	[Symbol.iterator](): ArrayIterator<Attr>;
	readonly length: number;
}

interface Element extends Node, ChildNode, NonDocumentTypeChildNode, ParentNode {
	readonly attributes: NamedNodeMap;
	readonly localName: string;
	readonly namespaceURI: string | null;
	readonly ownerDocument: Document;

	getAttribute(qualifiedName: string): string | null;
	getAttributeNS(namespace: string | null, localName: string): string | null;
	hasAttribute(qualifiedName: string): boolean;
	hasAttributeNS(namespace: string | null, localName: string): boolean;
	matches(selectors: string): boolean;
}

interface Attr extends Node {
	readonly localName: string;
	readonly namespaceURI: string | null;
	readonly ownerDocument: Document;
	readonly ownerElement: Element | null;
}

interface CharacterData extends ChildNode, NonDocumentTypeChildNode {}

interface Text extends Node, CharacterData {
	readonly ownerDocument: Document;
}

/**
 * Warning: In the TypeScript DOM lib, this interface `extends Text`. We do
 * not do this so we can distinguish their {@link nodeType} hints.
 */
interface CDATASection extends Node, CharacterData {
	readonly ownerDocument: Document;
}

interface Comment extends Node, CharacterData {
	readonly ownerDocument: Document;
}

interface ProcessingInstruction extends Node, CharacterData {
	readonly ownerDocument: Document;
}

interface XMLDocument extends Document {}

interface HTMLElement extends Element {}

interface DocumentType extends Node, ChildNode {}

interface XPathResult {
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
