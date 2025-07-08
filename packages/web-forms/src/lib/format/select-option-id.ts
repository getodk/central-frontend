import type { SelectItem, SelectNode } from '@getodk/xforms-engine';

export const selectOptionId = (node: SelectNode, optionItem: SelectItem): string => {
	return `${node.nodeId}_${optionItem.value}`;
};
