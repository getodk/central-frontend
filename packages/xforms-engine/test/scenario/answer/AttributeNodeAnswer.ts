import { ComparableAnswer } from './ComparableAnswer.ts';

export class AttributeNodeAnswer extends ComparableAnswer {
	readonly valueType = 'attribute';
	readonly stringValue: string;
	readonly value: string;

	constructor(readonly attributeValue: string) {
		super();
		this.stringValue = attributeValue;
		this.value = attributeValue;
	}
}
