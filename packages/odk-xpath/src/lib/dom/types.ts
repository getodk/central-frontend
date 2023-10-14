// TODO: replace named references to `document` with `contextDocument`
// (or other name[s] where appropriate), to minimize accidental reference
// to `globalThis.document` (which is almost never what we actually want).

export type ContextDocument =
  | Document
  | XMLDocument
  ;

type AnyContextNode =
  | ContextDocument
  | DocumentType
  | Element
  | Attr
  | Text
  | CDATASection
  | ProcessingInstruction
  | Comment
  ;

export type MaybeElementNode =
  & Node
  & AnyContextNode
  & Partial<Element>
  ;

// TODO: replace bare references to `Node` where possible. This will allow
// limited DOM types, potentially a more portable DOM access layer, e.g.:
//
// - Memoized DOM traversal and getter access
// - "Modeled" DOM, e.g. when an XForm structure is statically known
// - Non-browser DOM implementation, if so desired
export type ContextNode =
  & Node
  & AnyContextNode
  ;

export type MaybeDocumentOrElementNode =
  & MaybeElementNode
  & Partial<ContextDocument>
  ;

type AnyParentNode = Extract<AnyContextNode, { readonly children: any }>;

export type ContextParentNode =
  & Node
  & AnyParentNode
  ;

// Other nodes may be "named", but they are not treated as such for the
// purposes of XPath 1.0.
type AnyNamedNode =
  | Element
  | Attr
  | ProcessingInstruction
  ;

export type NamedNode =
  & Node
  & AnyNamedNode
  ;

export type NamespaceAttribute =
  & Attr
  & (
      | { readonly name: 'xmlns' }
      | { readonly prefix: 'xmlns' }
    );
