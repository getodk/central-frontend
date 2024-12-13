import type { AnyLeafNode, InputNode, ModelValueNode } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

export type ValueNode = AnyLeafNode | InputNode | ModelValueNode;

export abstract class ValueNodeAnswer<Node extends ValueNode = ValueNode> extends ComparableAnswer {
	constructor(readonly node: Node) {
		super();
	}
}
