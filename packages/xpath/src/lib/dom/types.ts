// TODO: replace named references to `document` with `contextDocument`
// (or other name[s] where appropriate), to minimize accidental reference
// to `globalThis.document` (which is almost never what we actually want).

export type ContextDocument = Document | XMLDocument;

type AnyContextNode =
	| Attr
	| CDATASection
	| Comment
	| ContextDocument
	| DocumentType
	| Element
	| ProcessingInstruction
	| Text;

type MaybeNode<T extends Node> = Node & Partial<Omit<T, keyof Node>>;

export type MaybeAttrNode = MaybeNode<Attr>;

export type MaybeElementNode = AnyContextNode & Node & Partial<Element>;

export type MaybeProcessingInstructionNode = MaybeNode<ProcessingInstruction>;

export type MaybeNamedNode = MaybeNode<MaybeAttrNode | MaybeElementNode>;

// TODO: replace bare references to `Node` where possible. This will allow
// limited DOM types, potentially a more portable DOM access layer, e.g.:
//
// - Memoized DOM traversal and getter access
// - "Modeled" DOM, e.g. when an XForm structure is statically known
// - Non-browser DOM implementation, if so desired
export type ContextNode = AnyContextNode & Node;

export type MaybeDocumentOrElementNode = MaybeElementNode & Partial<ContextDocument>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyParentNode = Extract<AnyContextNode, { readonly children: any }>;

export type ContextParentNode = AnyParentNode & Node;

// Other nodes may be "named", but they are not treated as such for the
// purposes of XPath 1.0.
type AnyNamedNode = Attr | Element | ProcessingInstruction;

export type NamedNode = AnyNamedNode & Node;

export type NamespaceAttribute = Attr & ({ readonly name: 'xmlns' } | { readonly prefix: 'xmlns' });
