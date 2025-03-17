import { XPathNodeKindKey } from '@getodk/xpath';
import { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { XFormsXPathAttribute } from '../adapter/XFormsXPathNode.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticElement } from './StaticElement.ts';
import { StaticNode } from './StaticNode.ts';
import { staticNodeName, type StaticNodeNameSource } from './staticNodeName.ts';

export interface StaticAttributeOptions {
	readonly name: StaticNodeNameSource;
	readonly value: string;
}

export class StaticAttribute extends StaticNode<'attribute'> implements XFormsXPathAttribute {
	readonly [XPathNodeKindKey] = 'attribute';
	readonly nodeType = 'static-attribute';
	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly qualifiedName: QualifiedName;
	readonly nodeset: string;
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
		this.qualifiedName = staticNodeName(options.name);
		this.nodeset = `${parent.nodeset}/@${this.qualifiedName.getPrefixedName()}`;
		this.value = options.value;
	}

	// XFormsXPathAttribute
	getXPathValue(): string {
		return this.value;
	}
}
