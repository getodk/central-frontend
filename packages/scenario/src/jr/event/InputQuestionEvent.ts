import { InputNodeAnswer } from '../../answer/InputNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class InputQuestionEvent extends QuestionEvent<'input'> {
	getAnswer(): InputNodeAnswer {
		return new InputNodeAnswer(this.node);
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { stringValue } = new UntypedAnswer(answerValue);

		this.node.setValue(stringValue);

		return new InputNodeAnswer(this.node);
	}
}
