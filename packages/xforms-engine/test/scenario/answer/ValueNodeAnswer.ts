import type {
	AnyLeafNode,
	InputNode,
	ModelValueNode,
	RangeNode,
	RankNode,
	SelectNode,
} from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

// prettier-ignore
export type ValueNode =
	| AnyLeafNode
	| InputNode
	| ModelValueNode
	| RangeNode
	| RankNode
	| SelectNode;

export abstract class ValueNodeAnswer<Node extends ValueNode = ValueNode> extends ComparableAnswer {
	constructor(readonly node: Node) {
		super();
	}
}
