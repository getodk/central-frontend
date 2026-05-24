import type { InstanceAttachmentFileName } from '@getodk/xforms-engine';
import { ComparableAnswer } from './ComparableAnswer.ts';

export class ExpectedBinaryAnswer extends ComparableAnswer {
	readonly stringValue: InstanceAttachmentFileName;

	constructor(readonly value: File | null) {
		super();

		this.stringValue = value?.name ?? '';
	}
}

export const binaryAnswer = (file: File | null): ExpectedBinaryAnswer => {
	return new ExpectedBinaryAnswer(file);
};
