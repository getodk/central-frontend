import {
	XFORMS_NAMESPACE_URI,
	XMLNS_NAMESPACE_URI,
	XMLNS_PREFIX,
} from '@getodk/common/constants/xmlns.ts';
import { InspectableComparisonError } from '@getodk/common/test/assertions/helpers.ts';
import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import { ComparableAssertableValue } from '../comparable/ComparableAssertableValue.ts';

class ComparableXMLQualifiedName {
	readonly sortKey: string;

	constructor(
		readonly namespaceURI: string | null,
		readonly nodeName: string,
		readonly localName: string
	) {
		let namespaceDeclarationType: string;

		if (namespaceURI === XMLNS_NAMESPACE_URI) {
			if (nodeName === XMLNS_PREFIX) {
				namespaceDeclarationType = 'default';
			} else {
				namespaceDeclarationType = 'non-default';
			}
		} else {
			namespaceDeclarationType = 'none';
		}

		this.sortKey = JSON.stringify({
			namespaceDeclarationType,
			namespaceURI,
			localName,
		});
	}

	toString(): string {
		const { namespaceURI, nodeName } = this;

		if (namespaceURI == null || namespaceURI === XFORMS_NAMESPACE_URI) {
			return this.localName;
		}

		return nodeName;
	}
}

class ComparableXMLAttribute {
	static from(attr: Attr): ComparableXMLAttribute {
		return new this(attr.namespaceURI, attr.nodeName, attr.localName, attr.value);
	}

	readonly qualifiedName: ComparableXMLQualifiedName;

	private constructor(
		namespaceURI: string | null,
		nodeName: string,
		localName: string,
		readonly value: string
	) {
		this.qualifiedName = new ComparableXMLQualifiedName(namespaceURI, nodeName, localName);
	}

	/**
	 * Note: re-serialization is space prefixed for easier use downstream (i.e.
	 * re-serialization of the element an attribute belongs to).
	 *
	 * @todo value re-escaping. Probably means moving XML escaping up to common
	 * after all?
	 */
	toString(): string {
		return ` ${this.qualifiedName.toString()}="${this.value}"`;
	}
}

const comparableXMLElementAttributes = (element: Element): readonly ComparableXMLAttribute[] => {
	const attributes = Array.from(element.attributes).map((attr) => {
		return ComparableXMLAttribute.from(attr);
	});

	return attributes.sort(
		(
			// prettier-ignore
			{ qualifiedName: { sortKey: a } },
			{ qualifiedName: { sortKey: b } }
		) => {
			if (a > b) {
				return 1;
			}

			if (b > a) {
				return -1;
			}

			return 0;
		}
	);
};

const isElement = (node: ChildNode): node is Element => {
	return node.nodeType === Node.ELEMENT_NODE;
};

const isText = (node: ChildNode): node is CDATASection | Text => {
	return node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.TEXT_NODE;
};

/**
 * @todo we will probably also need to support comments (e.g. if/when we leave
 * markers for non-relevant repeat sub-ranges).
 */
type ComparableXMLElementChild = ComparableXMLElement | string;

const comparableXMLElementChildren = (node: Element): readonly ComparableXMLElementChild[] => {
	const clone = node.cloneNode(true);

	clone.normalize();

	return Array.from(clone.childNodes).flatMap((child) => {
		if (isElement(child)) {
			return ComparableXMLElement.from(child);
		}

		if (isText(child)) {
			// TODO: collapse whitespace
			return child.data;
		}

		// TODO: more detail
		throw new Error('Unexpected node');
	});
};

class ComparableXMLElement {
	static fromXML(xml: string): ComparableXMLElement {
		const domParser = new DOMParser();
		const xmlDocument = domParser.parseFromString(xml, 'text/xml');

		return this.from(xmlDocument.documentElement);
	}

	static from(element: Element): ComparableXMLElement {
		const attributes = comparableXMLElementAttributes(element);
		const children = comparableXMLElementChildren(element);

		return new this(
			element.namespaceURI,
			element.nodeName,
			element.localName,
			attributes,
			children
		);
	}

	readonly qualifiedName: ComparableXMLQualifiedName;

	private constructor(
		namespaceURI: string | null,
		nodeName: string,
		localName: string,
		readonly attributes: readonly ComparableXMLAttribute[],
		readonly children: readonly ComparableXMLElementChild[]
	) {
		this.qualifiedName = new ComparableXMLQualifiedName(namespaceURI, nodeName, localName);
	}

	toString(): string {
		const attributes = this.attributes.map((attribute) => attribute.toString()).join('');
		const children = this.children.map((child) => child.toString()).join('');
		const nodeName = this.qualifiedName.toString();
		const prefix = `<${nodeName}${attributes}`;

		if (children === '') {
			return `${prefix}/>`;
		}

		return `${prefix}>${children}</${nodeName}>`;
	}
}

export class ComparableXMLSerialization extends ComparableAssertableValue {
	private _element: ComparableXMLElement | null = null;

	get element(): ComparableXMLElement {
		this._element ??= ComparableXMLElement.fromXML(this.xml);
		return this._element;
	}

	get stringValue(): string {
		return this.element.toString();
	}

	override equals(other: ComparableAssertableValue): SimpleAssertionResult {
		let pass: boolean;

		if (other instanceof ComparableXMLSerialization && this.xml === other.xml) {
			pass = true;
		} else {
			pass = this.stringValue === other.stringValue;
		}

		return pass || new InspectableComparisonError(this, other, 'equal');
	}

	constructor(readonly xml: string) {
		super();
	}
}
