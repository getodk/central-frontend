import type { StaticAttributeOptions } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type {
	StaticElementChildOption,
	StaticElementOptions,
} from '../../integration/xpath/static-dom/StaticElement.ts';
import type { QualifiedNameSource } from '../../lib/names/QualifiedName.ts';

const parseNodeName = (domNode: Attr | Element): QualifiedNameSource => {
	return {
		namespaceURI: domNode.namespaceURI,
		prefix: domNode.prefix,
		localName: domNode.localName,
	};
};

const parseStaticElementAttributes = (domElement: Element): readonly StaticAttributeOptions[] => {
	return Array.from(domElement.attributes).map((attr) => ({
		name: attr,
		value: attr.value,
	}));
};

const { ELEMENT_NODE, CDATA_SECTION_NODE, TEXT_NODE } = Node;

const parseStaticElementChildren = (domElement: Element): readonly StaticElementChildOption[] => {
	return Array.from(domElement.childNodes).flatMap((child) => {
		switch (child.nodeType) {
			case ELEMENT_NODE:
				return parseStaticElementOptions(child as Element);

			case TEXT_NODE:
			case CDATA_SECTION_NODE:
				return (child as CharacterData).data;

			default:
				return [];
		}
	});
};

const parseStaticElementOptions = (domElement: Element): StaticElementOptions => {
	return {
		name: parseNodeName(domElement),
		attributes: parseStaticElementAttributes(domElement),
		children: parseStaticElementChildren(domElement),
	};
};

interface ParseStaticDocumentFromDOMSubtreeOptions {
	readonly nodesetPrefix?: string;
}

export const parseStaticDocumentFromDOMSubtree = (
	subtreeRootElement: Element,
	options: ParseStaticDocumentFromDOMSubtreeOptions = {}
): StaticDocument => {
	const documentRoot = parseStaticElementOptions(subtreeRootElement);

	return new StaticDocument({
		...options,
		documentRoot,
	});
};
