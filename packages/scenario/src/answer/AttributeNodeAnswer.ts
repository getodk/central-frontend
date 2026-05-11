import type { AttributeNode } from '../../../xforms-engine/dist/client/AttributeNode';
import { ComparableAnswer } from './ComparableAnswer.ts';

export class AttributeNodeAnswer extends ComparableAnswer {
	readonly valueType = 'attribute';
	readonly stringValue: string;
	readonly value: string;

	constructor(readonly node: AttributeNode) {
		super();
		this.stringValue = node.currentState.value;
		this.value = node.currentState.value;
	}
}
