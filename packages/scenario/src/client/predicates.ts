import type { AnyNode, RepeatRangeNode } from '@getodk/xforms-engine';

export const isRepeatRange = (node: AnyNode): node is RepeatRangeNode => {
	return (
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);
};
