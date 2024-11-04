import type { EngineXPathNode } from './kind.ts';

export const getEngineXPathNodeValue = (node: EngineXPathNode): string => {
	return node.getXPathValue();
};
