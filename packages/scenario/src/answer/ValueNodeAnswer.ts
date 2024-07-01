import type { AnyLeafNode as ValueNode } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

export type { ValueNode };

export abstract class ValueNodeAnswer<Node extends ValueNode = ValueNode> extends ComparableAnswer {
	constructor(readonly node: Node) {
		super();
	}
}
