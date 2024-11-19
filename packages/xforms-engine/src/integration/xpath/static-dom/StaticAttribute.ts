import { XPathNodeKindKey } from '@getodk/xpath';
import type { XFormsXPathAttribute } from '../adapter/XFormsXPathNode.ts';
import type { StaticElement } from './StaticElement.ts';
import type { StaticNamedNodeOptions } from './StaticNamedNode.ts';
import { StaticNamedNode } from './StaticNamedNode.ts';

interface StaticAttributeOptions extends StaticNamedNodeOptions {
	readonly value: string;
}

export class StaticAttribute extends StaticNamedNode<'attribute'> implements XFormsXPathAttribute {
	readonly [XPathNodeKindKey] = 'attribute';
	readonly nodeType = 'static-attribute';
	readonly root: StaticElement;
	readonly attributes = [] as const;
	readonly children = null;
	override readonly value: string;

	constructor(
		override readonly parent: StaticElement,
		options: StaticAttributeOptions
	) {
		super(parent, options);

		this.root = parent.root;
		this.value = options.value;
	}

	// XFormsXPathAttribute
	getXPathValue(): string {
		return this.value;
	}
}
