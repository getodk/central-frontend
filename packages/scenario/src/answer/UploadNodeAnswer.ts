import type { InstanceAttachmentFileName, UploadNode, UploadValue } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class UploadNodeAnswer extends ValueNodeAnswer<UploadNode> {
	readonly valueType: 'binary';
	readonly stringValue: InstanceAttachmentFileName;
	readonly value: UploadValue;

	constructor(node: UploadNode) {
		super(node);
		this.valueType = node.valueType;
		this.stringValue = this.node.currentState.instanceValue;
		this.value = this.node.currentState.value;
	}
}
