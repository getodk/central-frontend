import { XPathNodeKindKey } from '@getodk/xpath';
import type { XFormsXPathDocument } from '../adapter/XFormsXPathNode.ts';
import { StaticElement } from './StaticElement.ts';
import { StaticNode } from './StaticNode.ts';

export type StaticDocumentRootFactory<T extends StaticDocument, Root extends StaticElement> = (
	staticDocument: T
) => Root;

export abstract class StaticDocument<DocumentRoot extends StaticElement = StaticElement>
	extends StaticNode<'document'>
	implements XFormsXPathDocument
{
	readonly [XPathNodeKindKey] = 'document';
	readonly nodeType = 'static-document';
	readonly rootDocument: StaticDocument;
	readonly root: DocumentRoot;
	readonly parent = null;
	readonly children: readonly [root: DocumentRoot];

	constructor(rootFactory: StaticDocumentRootFactory<StaticDocument<DocumentRoot>, DocumentRoot>) {
		super();

		this.rootDocument = this;

		const root = rootFactory(this);

		this.root = root;
		this.children = [root];
	}

	// XFormsXPathDocument
	getXPathValue(): string {
		return this.root.getXPathValue();
	}
}
