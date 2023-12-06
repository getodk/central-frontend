/* eslint-disable @typescript-eslint/no-shadow */
import { expect } from 'vitest';
import {
	isAttributeNode,
	isCommentNode,
	isElementNode,
	isTextNode,
} from '../../lib/dom/predicates.ts';

export const expectEqualComment = (actual: Node, expected: Comment) => {
	expect(isCommentNode(actual)).toBe(true);

	const comment = actual as Comment;

	expect(comment.textContent).toBe(expected.textContent);
};

export const expectEqualTextNode = (actual: Node, expected: Text) => {
	expect(isTextNode(actual)).toBe(true);

	const text = actual as Text;

	expect(text.textContent).toBe(expected.textContent);
};

export const expectEqualAttribute = (actual: Node, expected: Attr) => {
	expect(isAttributeNode(actual)).toBe(true);

	const attribute = actual as Attr;

	expect(attribute.namespaceURI).toBe(expected.namespaceURI);
	expect(attribute.localName).toBe(expected.localName);
	expect(attribute.value).toBe(expected.value);
};

const sortAttributes = (attributes: Iterable<Attr>): readonly Attr[] => {
	return Array.from(attributes).sort((a, b) => {
		const { namespaceURI: aNS, localName: aName } = a;
		const { namespaceURI: bNS, localName: bName } = b;

		if (aNS == null && bNS != null) {
			return 1;
		}

		if (aNS != null && bNS == null) {
			return -1;
		}

		if (aNS != null && bNS != null && aNS !== bNS) {
			return aNS > bNS ? 1 : -1;
		}

		// Elements shouldn't have two attributes of the same name. It's assumed
		// that the call is from `expectEqualAttributes`, where it's then
		// assumed that the call is comparing attribute lists between elements.
		return aName > bName ? 1 : -1;
	});
};

export const expectEqualAttributes = (actual: Iterable<Attr>, expected: Iterable<Attr>) => {
	const expectedSorted = sortAttributes(expected);
	const actualSorted = sortAttributes(actual);

	expect(actualSorted.length).toBe(expectedSorted.length);

	for (const [index, expected] of expectedSorted.entries()) {
		const actual = actualSorted[index]!;

		expectEqualAttribute(actual, expected);
	}
};

export const expectEqualElement = (actual: Node, expected: Element) => {
	expect(isElementNode(actual));

	const element = actual as Element;

	expect(element.namespaceURI).toBe(expected.namespaceURI);
	expect(element.localName).toBe(expected.localName);
	expectEqualAttributes(element.attributes, expected.attributes);
	expect(element.childNodes.length).toBe(expected.childNodes.length);

	for (const [index, expectedChildNode] of Array.from(expected.childNodes).entries()) {
		const actualChildNode = element.childNodes[index]!;

		expectEqualNode(actualChildNode, expectedChildNode);
	}
};

export const expectEqualNode = (actual: Node, expected: Node) => {
	if (isElementNode(expected)) {
		expectEqualElement(actual, expected);
	} else if (isTextNode(expected)) {
		expectEqualTextNode(actual, expected);
	} else if (isAttributeNode(expected)) {
		expectEqualAttribute(actual, expected);
	} else if (isCommentNode(expected)) {
		expectEqualComment(actual, expected);
	} else {
		throw new Error(`Unhandled expected node: ${String(expected)}`);
	}
};
