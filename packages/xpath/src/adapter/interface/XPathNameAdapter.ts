import type { XPathNode } from './XPathNode.ts';
import type {
	AdapterProcessingInstruction,
	AdapterQualifiedNamedNode,
} from './XPathNodeKindAdapter.ts';

export interface XPathNameAdapter<T extends XPathNode> {
	readonly getNamespaceURI: (node: AdapterQualifiedNamedNode<T>) => string | null;

	/**
	 * @todo Confirm usage in the following function implementations:
	 *
	 * - `name` (fn namespace): Should we return the document-defined prefix, or
	 *   resolve it from the node's namespace URI? The WHAT Working Group
	 *   (default) adapter will do the former; downstream usage currently punts on
	 *   this!
	 * - `position` (xf namespace): extends XPath 1.0 spec semantics to support
	 *   lookup of position **among contiguous same-named nodes**. An answer to
	 *   the above question on `fn:name` may or may not impact whether usage of
	 *   this API for that purpose is appropriate.
	 *
	 * If either warrant correction, we'll want to revisit this type as well.
	 */
	readonly getQualifiedName: (node: AdapterQualifiedNamedNode<T>) => string;

	readonly getLocalName: (node: AdapterQualifiedNamedNode<T>) => string;
	readonly getProcessingInstructionName: (node: AdapterProcessingInstruction<T>) => string;
	readonly resolveNamespaceURI: (node: T, prefix: string | null) => string | null;
}
