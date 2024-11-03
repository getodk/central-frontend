import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFormsXPathNamedNode, XPathNamedNodeKind } from '../adapter/XFormsXPathNode.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticParentNode } from './StaticNode.ts';
import { StaticNode } from './StaticNode.ts';

export interface StaticNamedNodeOptions {
	readonly namespaceURI: string | null;
	readonly localName: string;
	readonly value?: string;
}

export abstract class StaticNamedNode<Kind extends XPathNamedNodeKind>
	extends StaticNode<Kind>
	implements XFormsXPathNamedNode
{
	readonly rootDocument: StaticDocument;
	readonly isXFormsNamespace: boolean;
	readonly namespaceURI: string | null;
	readonly localName: string;
	readonly value: string | null;

	protected constructor(
		readonly parent: StaticParentNode,
		options: StaticNamedNodeOptions
	) {
		super();

		this.rootDocument = parent.rootDocument;

		const { namespaceURI, localName, value = null } = options;

		this.namespaceURI = namespaceURI;
		this.localName = localName;
		this.value = value;

		if (namespaceURI === XFORMS_NAMESPACE_URI) {
			this.isXFormsNamespace = true;
		} else if (parent == null || parent.isXFormsNamespace) {
			this.isXFormsNamespace = namespaceURI == null;
		} else {
			this.isXFormsNamespace = false;
		}
	}
}
