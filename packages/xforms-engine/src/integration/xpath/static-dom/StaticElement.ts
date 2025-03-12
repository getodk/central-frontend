import type { QualifiedNameSource } from '../../../lib/names/QualifiedName.ts';
import { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { EngineDOMAdapter } from '../adapter/engineDOMAdapter.ts';
import type { XFormsXPathElement } from '../adapter/XFormsXPathNode.ts';
import type { StaticAttributeOptions } from './StaticAttribute.ts';
import { StaticAttribute } from './StaticAttribute.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticChildNode } from './StaticNode.ts';
import { staticNodeName } from './staticNodeName.ts';
import { StaticParentNode } from './StaticParentNode.ts';
import { StaticText } from './StaticText.ts';

// prettier-ignore
export type StaticElementChildOption =
	| StaticElementOptions
	| string;

export interface StaticElementOptions {
	readonly name: QualifiedNameSource | string;
	readonly attributes?: readonly StaticAttributeOptions[];
	readonly children?: readonly StaticElementChildOption[];
}

export class StaticElement extends StaticParentNode<'element'> implements XFormsXPathElement {
	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly qualifiedName: QualifiedName;
	readonly nodeset: string;
	readonly attributes: readonly StaticAttribute[];
	readonly children: readonly StaticChildNode[];
	readonly value = null;

	constructor(
		readonly parent: StaticDocument | StaticElement,
		options: StaticElementOptions
	) {
		super('element');

		const { rootDocument } = parent;
		let nodesetPrefix = parent.nodeset;

		this.rootDocument = rootDocument;

		// Account for the fact that we may be constructing the document root!
		if (parent === rootDocument) {
			this.root = this;

			// Avoid nodeset like `//foo` when `/foo` is expected/intended
			if (nodesetPrefix === '/') {
				nodesetPrefix = '';
			}
		} else {
			this.root = parent.root;
		}

		const { name, attributes = [], children = [] } = options;

		this.qualifiedName = staticNodeName(name);
		this.nodeset = `${nodesetPrefix}/${this.qualifiedName.getPrefixedName()}`;
		this.attributes = attributes.map((attrOptions) => {
			return new StaticAttribute(this, attrOptions);
		});
		this.children = children.map((child) => {
			if (typeof child === 'string') {
				return new StaticText(this, child);
			}

			return new StaticElement(this, child);
		});
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching
	 */
	protected getAttributeNode(localName: string): StaticAttribute | null {
		return (
			this.attributes.find((attribute) => {
				return attribute.qualifiedName.localName === localName;
			}) ?? null
		);
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching (especially asserting known
	 * attributes!)
	 * @todo As long as this depends on {@link getAttributeNode}, push assertion
	 * up. (This was put off because the types are already plenty complex as it
	 * is.)
	 */
	getAttributeValue(localName: string): string | null {
		const attribute = this.getAttributeNode(localName);
		const value = attribute?.value ?? null;

		return value;
	}

	// XFormsXPathElement
	getXPathValue(): string {
		return this.children.map((child) => child.getXPathValue()).join('');
	}
}
