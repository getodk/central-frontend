import type { XFormsXPathDocument } from '../adapter/XFormsXPathNode.ts';
import { StaticElement } from './StaticElement.ts';
import { StaticParentNode } from './StaticParentNode.ts';

export type StaticDocumentRootFactory<T extends StaticDocument, Root extends StaticElement> = (
	staticDocument: T
) => Root;

export abstract class StaticDocument<DocumentRoot extends StaticElement = StaticElement>
	extends StaticParentNode<'document'>
	implements XFormsXPathDocument
{
	readonly rootDocument: StaticDocument;
	readonly root: DocumentRoot;
	readonly parent = null;
	readonly children: readonly [root: DocumentRoot];

	constructor(rootFactory: StaticDocumentRootFactory<StaticDocument<DocumentRoot>, DocumentRoot>) {
		super('document');

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
