import type {
	XPathAttributeKind,
	XPathCommentKind,
	XPathDocumentKind,
	XPathElementKind,
	XPathTextKind,
} from '@getodk/xpath';
import { XPathNodeKindKey } from '@getodk/xpath';

const XFORMS_XPATH_NODE_RANGE_BRAND = Symbol('XFORMS_XPATH_NODE_RANGE_BRAND');

/**
 * To be used with any engine representation of a "range" of contiguous child
 * nodes (also somewhat analogous to a DOM "fragment"). This mapping is
 * conceptually disjoint, but serves an important purpose:
 *
 * - While such a "range" may increase the hierarchical depth of an
 *   engine-internal representation, it **DOES NOT** contribute the same
 *   hierarchy in XPath evaluation semantics.
 * - Such a "range" may be treated as a distinct context node for evaluating an
 *   expression. This most cleanly maps to XPath's comment semantics in that it
 *   allows the "range" to have a clear document position (hierarchically a
 *   child of its parent element; sequentially a sibling to that parent's other
 *   child nodes).
 *
 * (Note: while this is phrased as an abstract concept, it is intended to
 * correspond directly to the engine's "repeat range" concept. The specific type
 * is not referenced here because they have an inverse relationship in the
 * module/type graph.)
 */
// prettier-ignore
export type XFormsXPathNodeRangeKind =
	& 'comment'
	& { readonly [XFORMS_XPATH_NODE_RANGE_BRAND]: true };

export const XFORMS_XPATH_NODE_RANGE_KIND = 'comment' as XFormsXPathNodeRangeKind;

// prettier-ignore
export type XFormsXPathNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathDocumentKind
	| XFormsXPathNodeRangeKind
	| XPathElementKind
	| XPathAttributeKind
	| XPathTextKind
	| XPathCommentKind;

export interface XFormsXPathNode {
	readonly [XPathNodeKindKey]: XFormsXPathNodeKind;
	readonly rootDocument: XFormsXPathDocument;
	readonly root: XFormsXPathElement;

	getXPathChildNodes(this: XFormsXPathNode): readonly XFormsXPathDescendantNode[];
	getXPathValue(this: XFormsXPathNode): string;
}

export interface XFormsXPathDocument extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathDocumentKind;
}

export interface XFormsXPathElement extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathElementKind;
}

/**
 * @see {@link XFormsXPathNodeRangeKind}
 */
export interface XFormsXPathNodeRange extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XFormsXPathNodeRangeKind;
}

export interface XFormsXPathAttribute extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathAttributeKind;
}

export interface XFormsXPathText extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathTextKind;
}

export interface XFormsXPathComment extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathCommentKind;
}

// prettier-ignore
export type XPathNamedNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathElementKind
	| XPathAttributeKind;

export interface XFormsXPathNamedNode extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XPathNamedNodeKind;
}

// prettier-ignore
export type XFormsXPathDescendantNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XFormsXPathNodeRangeKind
	| XPathElementKind
	| XPathTextKind
	| XPathCommentKind
	| XPathAttributeKind;

export interface XFormsXPathDescendantNode extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XFormsXPathDescendantNodeKind;
}

// prettier-ignore
export type XFormsXPathPrimaryInstanceNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathDocumentKind
	| XFormsXPathNodeRangeKind
	| XPathElementKind
	| XPathAttributeKind
	| XPathTextKind;

export interface XFormsXPathPrimaryInstanceNode extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XFormsXPathPrimaryInstanceNodeKind;
}

// prettier-ignore
export type XFormsXPathPrimaryInstanceDescendantNodeKind =
	| XFormsXPathNodeRangeKind
	| XPathAttributeKind
	| XPathElementKind
	| XPathTextKind;

export interface XFormsXPathPrimaryInstanceDescendantNode extends XFormsXPathNode {
	readonly [XPathNodeKindKey]: XFormsXPathPrimaryInstanceDescendantNodeKind;
}
