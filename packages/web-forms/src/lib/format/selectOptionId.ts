import type { SelectItem, SelectNode, ValueType } from '@getodk/xforms-engine';

export const selectOptionId = (node: SelectNode, optionItem: SelectItem<ValueType>): string => {
	return `${node.nodeId}_${optionItem.asString}`;
};
