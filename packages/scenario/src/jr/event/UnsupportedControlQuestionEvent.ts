import type { AnyUnsupportedControlNode } from '@getodk/xforms-engine';
import { UnsupportedControlNodeAnswer } from '../../answer/UnsupportedControlNodeAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

type UnsupportedControlQuestionType = AnyUnsupportedControlNode['nodeType'];

export class UnsupportedControlQuestionEvent extends QuestionEvent<UnsupportedControlQuestionType> {
	getAnswer(): UnsupportedControlNodeAnswer {
		return new UnsupportedControlNodeAnswer(this.node);
	}

	answerQuestion(_: unknown): ValueNodeAnswer {
		throw new Error(`Setting value of node not supported (type:${this.node.nodeType})`);
	}
}
