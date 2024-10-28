import type { WHATNode } from './WHATNode.ts';

export const getWHATNodeValue = (node: WHATNode): string => {
	return node.textContent ?? '';
};
