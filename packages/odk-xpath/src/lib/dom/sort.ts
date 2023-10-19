import type { MaybeAttrNode } from './types';

const { DOCUMENT_POSITION_FOLLOWING, DOCUMENT_POSITION_PRECEDING } = Node;

export const sortDocumentOrder = (nodes: Iterable<Node>) => {
	const array = Array.from(nodes);

	if (array.length < 2) {
		return array;
	}

	return array.sort((a, b) => {
		const compared = b.compareDocumentPosition(a);

		// Specific to jsdom(?)
		if (compared === 0 && a !== b) {
			if ((a as MaybeAttrNode).ownerElement === b) {
				return 1;
			}

			if (a === (b as MaybeAttrNode).ownerElement) {
				return -1;
			}
		}

		if (compared & DOCUMENT_POSITION_FOLLOWING) {
			return 1;
		}

		if (compared & DOCUMENT_POSITION_PRECEDING) {
			return -1;
		}

		return 0;
	});
};
