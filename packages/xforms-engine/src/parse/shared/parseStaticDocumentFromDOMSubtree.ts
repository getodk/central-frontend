import type { AnyConstructor } from '@getodk/common/types/helpers.js';
import type { StaticAttributeOptions } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type {
	StaticDocument,
	StaticDocumentConstructor,
	StaticDocumentRootFactory,
} from '../../integration/xpath/static-dom/StaticDocument.ts';
import type {
	StaticElementChildOption,
	StaticElementConstructor,
	StaticElementOptions,
} from '../../integration/xpath/static-dom/StaticElement.ts';
import { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';

type ConcreteConstructor<T extends AnyConstructor> = Pick<T, keyof T>;

// prettier-ignore
export type ConcreteStaticDocumentConstructor<
	T extends StaticDocument<Root>,
	Root extends StaticElement,
> =
	& ConcreteConstructor<typeof StaticDocument<Root>>
	& (new (rootFactory: StaticDocumentRootFactory<T, Root>) => T);

const parseStaticElementAttributes = (domElement: Element): readonly StaticAttributeOptions[] => {
	return Array.from(domElement.attributes).map((attr) => ({
		namespaceURI: attr.namespaceURI,
		localName: attr.localName,
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
	const { namespaceURI, localName } = domElement;

	return {
		namespaceURI,
		localName,
		attributes: parseStaticElementAttributes(domElement),
		children: parseStaticElementChildren(domElement),
	};
};

export const parseStaticDocumentFromDOMSubtree = <
	T extends StaticDocument<Root>,
	Root extends StaticElement<T>,
>(
	DocumentConstructor: StaticDocumentConstructor<T, Root>,
	DocumentRootConstructor: StaticElementConstructor<Root, T>,
	subtreeRootElement: Element
): T => {
	const documentRoot = parseStaticElementOptions(subtreeRootElement);

	return new DocumentConstructor({
		DocumentRootConstructor,
		documentRoot,
	});
};
