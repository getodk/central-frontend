import type { XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XPathDOMAdapter } from './XPathDOMAdapter.ts';

export type XPathDocumentKind = 'document';
export type XPathElementKind = 'element';
export type XPathNamespaceDeclarationKind = 'namespace_declaration';
export type XPathAttributeKind = 'attribute';
export type XPathTextKind = 'text';
export type XPathCommentKind = 'comment';
export type XPathProcessingInstructionKind = 'processing_instruction';

// prettier-ignore
export type XPathNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathDocumentKind
	| XPathElementKind
	| XPathNamespaceDeclarationKind
	| XPathAttributeKind
	| XPathTextKind
	| XPathCommentKind
	| XPathProcessingInstructionKind;

export const XPathNodeKindKey: unique symbol = Symbol('XPathNodeKindKey');
export type XPathNodeKindKey = typeof XPathNodeKindKey;

/**
 * Any representation of a "document" (or "root") node, having semantics
 * consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 *
 * @todo Since we're intentionally using XPath semantics throughout, should we
 * consider renaming this `XPathRoot`? If we're going to use "root node" to
 * refer to this concept, we'll want to (a) be sure we make the change
 * thoroughly throughout `@getodk/xpath` and (b) think of how we make
 * corresponding name changes downstream.
 */
export interface XPathDocument {
	readonly [XPathNodeKindKey]: XPathDocumentKind;
}

/**
 * Any representation of an "element" node, having semantics consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 */
export interface XPathElement {
	readonly [XPathNodeKindKey]: XPathElementKind;
}

/**
 * Any representation of a "namespace declaration" node, having semantics
 * consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 *
 * Note: in XML syntax, a namespace declaration is defined as a qualified
 * name/URI value pair, defined on an {@link XPathElement | element}, where:
 *
 * 1. The name is in the {@link XMLNS_NAMESPACE_URI | XMLNS namespace}, defined
 *    in XML as one of:
 *
 *     - `xmlns` (representing the default namespace for that element and for
 *       descendants which do not re-declare a default namespace)
 *
 *     - a colon-separated name with an `xmlns` prefix and an arbitrary local
 *       name suffix (representing a prefix associated with the namespace
 *       declaration, for that element and for descendants which do not
 *       re-declare a namespace for that prefix)
 *
 * 2. The value is a URI representing the namespace being declared.
 *
 * This syntax is textually similar to that of
 * {@link XPathAttribute | attributes}, but such nodes are **NOT** considered
 * attributes in XPath semantics. The factor distinguishing namespace
 * declarations from attributes is the node's name and/or prefix.
 */
export interface XPathNamespaceDeclaration {
	readonly [XPathNodeKindKey]: XPathNamespaceDeclarationKind;
}

/**
 * Any representation of an "attribute" node, having semantics consistent with
 * the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 *
 * Note: XPath semantics distinguish attributes from namespace declarations,
 * despite their XML syntax similarity.
 *
 * @see {@link XPathNamespaceDeclaration} for additional clarification of this
 * distinction.
 */
export interface XPathAttribute {
	readonly [XPathNodeKindKey]: XPathAttributeKind;
}

/**
 * Any representation of a "text" node, having semantics
 * consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 */
export interface XPathText {
	readonly [XPathNodeKindKey]: XPathTextKind;
}

/**
 * Any representation of a "comment" node, having semantics
 * consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 */
export interface XPathComment {
	readonly [XPathNodeKindKey]: XPathCommentKind;
}

/**
 * Any representation of a "processing instruction" node, having semantics
 * consistent with the
 * {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#data-model | XPath 1.0 data model},
 * and as implemented/provided by an {@link XPathDOMAdapter}.
 */
export interface XPathProcessingInstruction {
	readonly [XPathNodeKindKey]: XPathProcessingInstructionKind;
}

/**
 * An {@link XPathNode} is a (mostly) opaque type, used generically throughout
 * `@getodk/xpath` as any {@link XPathDOMAdapter}'s arbitrary node
 * implementation/representation.
 *
 * The `@getodk/xpath` package **DOES NOT** directly access any details of an
 * {@link XPathNode}, except through access points provided by a
 * {@link XPathDOMAdapter}.
 *
 * While each {@link XPathNode} _type_ specifies a property associated with
 * {@link XPathNodeKindKey}, `@getodk/xpath` does not even access this property
 * directly (again, unless that access is implemented by an
 * {@link XPathDOMAdapter}).
 *
 * The key **MAY** be used by an {@link XPathDOMAdapter} in its node
 * representations, distinguishing their XPath semantic kind as defined in the
 * types herein; this is **RECOMMENDED**, where possible for a particular
 * adapter.
 *
 * But it is not strictly necessary for an {@link XPathDOMAdapter}
 * implementation to use the {@link XPathNodeKindKey} for this purpose. The
 * intent of including the key in these opaque node type definitions is to
 * provide a clear type-level representation of "any node" (or "any [kind of]
 * node" for each of its constituent union members), without expressing any
 * further assumptions about those nodes' structures or capabilities.
 *
 * This allows `@getodk/xpath` itself to operate on nodes _in terms of their
 * XPath semantics_, while otherwise deferring the implementation _of those
 * semantics_ to {@link XPathDOMAdapter} implementations.
 */
// prettier-ignore
export type XPathNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| XPathDocument
	| XPathElement
	| XPathNamespaceDeclaration
	| XPathAttribute
	| XPathText
	| XPathComment
	| XPathProcessingInstruction;

/**
 * **HERE BE DRAGONS!**
 *
 * In practice, real world XPathEvaluator implementations may produce a
 * {@link https://www.w3.org/TR/xml/#dtd | Document Type Declaration (DTD)} node
 * for certain expressions. (Most trivially: common browser implementations will
 * return a DTD, if present in the context document, for the expression
 * `/node()`!) Importantly, this behavior is **NOT SUPPORTED** by the XPath 1.0
 * specification.
 *
 * We provide this type as an accommodation for {@link XPathDOMAdapter}
 * implementations which opt to support this common-but-unspecified behavior. It
 * is intentionally distinct from the other members of {@link XPathNodeKind}, in
 * order to convey that:
 *
 * 1. If an adapter implementation produces a node associated with this kind, it
 *    will not be regarded as any of the node kinds explicitly supported by
 *    XPath.
 *
 * 2. Following from that: nodes of this kind cannot be accessed by any
 *    (implicit or explicit) XPath syntax which should produce a node type more
 *    specific than the `node()`
 *    {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#NT-NodeTest | NodeTest}
 *    sub-expression.
 *
 * 3. Adapters implementing this node kind should **USE WITH CAUTION**!
 */
export type UnspecifiedNonXPathNodeKind = 'UNSPECIFIED_NON_XPATH_NODE';
