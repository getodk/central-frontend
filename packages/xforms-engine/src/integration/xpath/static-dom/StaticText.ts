import { XPathNodeKindKey } from '@getodk/xpath';
import type { XFormsXPathText } from '../adapter/XFormsXPathNode.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticElement } from './StaticElement.ts';
import { StaticNode } from './StaticNode.ts';

export class StaticText extends StaticNode<'text'> implements XFormsXPathText {
	readonly [XPathNodeKindKey] = 'text';
	readonly nodeType = 'static-text';
	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly children = null;

	constructor(
		readonly parent: StaticElement,
		readonly value: string
	) {
		super();

		this.rootDocument = parent.rootDocument;
		this.root = parent.root;
	}

	// XFormsXPathText
	getXPathValue(): string {
		return this.value;
	}
}
