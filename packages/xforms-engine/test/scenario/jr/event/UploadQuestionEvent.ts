import { UploadNodeAnswer } from '../../answer/UploadNodeAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class UploadQuestionEvent extends QuestionEvent<'upload'> {
	getAnswer(): UploadNodeAnswer {
		return new UploadNodeAnswer(this.node);
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;

		if (answerValue instanceof File || answerValue === null) {
			node.setValue(answerValue);

			return this.getAnswer();
		}

		throw new Error('Failed to answer upload question: expected answer to be a `File` or `null`');
	}
}
