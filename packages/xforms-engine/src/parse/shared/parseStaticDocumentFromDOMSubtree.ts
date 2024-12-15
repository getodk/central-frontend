import type { AnyConstructor } from '@getodk/common/types/helpers.js';
import type { StaticAttributeOptions } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type {
	StaticDocument,
	StaticDocumentRootFactory,
} from '../../integration/xpath/static-dom/StaticDocument.ts';
import type {
	StaticElementChildOption,
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

// prettier-ignore
export type StaticElementConstructor<
	T extends StaticElement<Parent>,
	Parent extends StaticDocument<T> | StaticElement,
> =
	& ConcreteConstructor<typeof StaticElement>
	& {
			readonly prototype: T;

			new (
				parent: Parent,
				options: StaticElementOptions
			): T;
	};

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

const parseStaticElementFromDOMElement = <
	T extends StaticElement<Parent>,
	Parent extends StaticDocument<T> | StaticElement,
>(
	parent: Parent,
	ElementConstructor: StaticElementConstructor<T, Parent>,
	domElement: Element
): T => {
	const options = parseStaticElementOptions(domElement);

	return new ElementConstructor(parent, options);
};

export const parseStaticDocumentFromDOMSubtree = <
	T extends StaticDocument<Root>,
	Root extends StaticElement<T>,
>(
	DocumentConstructor: ConcreteStaticDocumentConstructor<T, Root>,
	DocumentRootConstructor: StaticElementConstructor<Root, T>,
	subtreeRootElement: Element
): T => {
	const rootFactory: StaticDocumentRootFactory<T, Root> = (parent) => {
		return parseStaticElementFromDOMElement(parent, DocumentRootConstructor, subtreeRootElement);
	};

	return new DocumentConstructor(rootFactory);
};
