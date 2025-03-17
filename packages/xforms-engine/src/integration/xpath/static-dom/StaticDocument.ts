import type { XFormsXPathDocument } from '../adapter/XFormsXPathNode.ts';
import type { StaticElementOptions } from './StaticElement.ts';
import { StaticElement } from './StaticElement.ts';
import { StaticParentNode } from './StaticParentNode.ts';

interface StaticDocumentOptions {
	readonly documentRoot: StaticElementOptions;
	readonly nodesetPrefix?: string;
}

export class StaticDocument extends StaticParentNode<'document'> implements XFormsXPathDocument {
	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly parent = null;
	readonly nodeset: string;
	readonly children: readonly [root: StaticElement];
	readonly childElements: readonly [root: StaticElement];

	constructor(options: StaticDocumentOptions) {
		super('document');

		this.nodeset = options.nodesetPrefix ?? '/';
		this.rootDocument = this;

		const { documentRoot } = options;
		const root = new StaticElement(this, documentRoot);

		this.root = root;
		this.children = [root];
		this.childElements = this.children;
	}

	// XFormsXPathDocument
	getXPathValue(): string {
		return this.root.getXPathValue();
	}
}
