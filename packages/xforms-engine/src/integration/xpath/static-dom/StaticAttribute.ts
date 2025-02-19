import { XPathNodeKindKey } from '@getodk/xpath';
import { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { XFormsXPathAttribute } from '../adapter/XFormsXPathNode.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticElement } from './StaticElement.ts';
import { StaticNode } from './StaticNode.ts';

interface StaticAttributeOptions {
	readonly namespaceURI: string | null;
	readonly prefix?: string | null;
	readonly localName: string;
	readonly value: string;
}

export class StaticAttribute extends StaticNode<'attribute'> implements XFormsXPathAttribute {
	readonly [XPathNodeKindKey] = 'attribute';
	readonly nodeType = 'static-attribute';
	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly qualifiedName: QualifiedName;
	readonly attributes = [] as const;
	readonly children = null;
	readonly value: string;

	constructor(
		readonly parent: StaticElement,
		options: StaticAttributeOptions
	) {
		super();

		this.rootDocument = parent.rootDocument;
		this.root = parent.root;
		this.qualifiedName = new QualifiedName(options);
		this.value = options.value;
	}

	// XFormsXPathAttribute
	getXPathValue(): string {
		return this.value;
	}
}
