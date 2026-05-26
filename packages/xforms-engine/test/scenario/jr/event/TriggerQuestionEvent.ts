import { TriggerNodeAnswer } from '../../answer/TriggerNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class TriggerQuestionEvent extends QuestionEvent<'trigger'> {
	getAnswer(): TriggerNodeAnswer {
		return new TriggerNodeAnswer(this.node);
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { booleanValue } = new UntypedAnswer(answerValue);

		this.node.setValue(booleanValue);

		return new TriggerNodeAnswer(this.node);
	}
}
