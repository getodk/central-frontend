import type { AnyLeafNode, InputNode, ModelValueNode, RangeNode } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

export type ValueNode = AnyLeafNode | InputNode | ModelValueNode | RangeNode;

export abstract class ValueNodeAnswer<Node extends ValueNode = ValueNode> extends ComparableAnswer {
	constructor(readonly node: Node) {
		super();
	}
}
