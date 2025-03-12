import { XFORMS_KNOWN_ATTRIBUTE, XFORMS_LOCAL_NAME } from '@getodk/xpath';
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
type StaticElementParent =
	| StaticDocument
	| StaticElement;

// prettier-ignore
export type StaticElementChildOption =
	| StaticElementOptions
	| string;

export interface StaticElementOptions {
	readonly name: QualifiedNameSource | string;
	readonly attributes?: readonly StaticAttributeOptions[];
	readonly children?: readonly StaticElementChildOption[];
}

type StaticElementKnownAttributeValue<
	T extends StaticElement,
	LocalName extends string,
> = T extends { readonly [XFORMS_KNOWN_ATTRIBUTE]: LocalName } ? string : string | null;

type AssertStaticElementKnownAttributeValue = <T extends StaticElement, LocalName extends string>(
	element: T,
	localName: LocalName,
	value: string | null
) => asserts value is StaticElementKnownAttributeValue<T, LocalName>;

const assertStaticElementKnownAttributeValue: AssertStaticElementKnownAttributeValue = (
	element,
	localName,
	value
) => {
	if (localName === element[XFORMS_KNOWN_ATTRIBUTE] && value == null) {
		throw new Error(`Expected attribute: ${element[XFORMS_KNOWN_ATTRIBUTE]}`);
	}
};

export class StaticElement<Parent extends StaticElementParent = StaticElementParent>
	extends StaticParentNode<'element'>
	implements XFormsXPathElement
{
	readonly [XFORMS_LOCAL_NAME]?: string;
	readonly [XFORMS_KNOWN_ATTRIBUTE]?: string;

	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly qualifiedName: QualifiedName;
	readonly attributes: readonly StaticAttribute[];
	readonly children: readonly StaticChildNode[];
	readonly value = null;

	constructor(
		readonly parent: Parent,
		options: StaticElementOptions
	) {
		super('element');

		const { rootDocument } = parent;

		this.rootDocument = rootDocument;

		// Account for the fact that we may be constructing the document root!
		if (parent === rootDocument) {
			this.root = this;
		} else {
			this.root = parent.root;
		}

		const { name, attributes = [], children = [] } = options;

		this.qualifiedName = staticNodeName(name);
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
	getAttributeValue<This extends StaticElement, LocalName extends string>(
		this: This,
		localName: LocalName
	): StaticElementKnownAttributeValue<This, LocalName> {
		const attribute = this.getAttributeNode(localName);
		const value = attribute?.value ?? null;

		assertStaticElementKnownAttributeValue(this, localName, value);

		return value;
	}

	// XFormsXPathElement
	getXPathValue(): string {
		return this.children.map((child) => child.getXPathValue()).join('');
	}
}

// prettier-ignore
export type StaticElementConstructor<
	T extends StaticElement<Parent>,
	Parent extends StaticDocument<T> | StaticElement,
> =
	& Pick<typeof StaticElement, keyof typeof StaticElement>
	& {
			readonly prototype: T;

			new (
				parent: Parent,
				options: StaticElementOptions
			): T;
	};
