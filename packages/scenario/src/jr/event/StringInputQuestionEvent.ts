import { StringNodeAnswer } from '../../answer/StringNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class StringInputQuestionEvent extends QuestionEvent<'string'> {
	getAnswer(): StringNodeAnswer {
		return new StringNodeAnswer(this.node);
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { stringValue } = new UntypedAnswer(answerValue);

		this.node.setValue(stringValue);

		return new StringNodeAnswer(this.node);
	}
}
