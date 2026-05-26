import { NoteNodeAnswer } from '../../answer/NoteNodeAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

/**
 * @todo Naming awkwardness. Notes are sort of "question"-like in that they can
 * produce an "answer" (value representation). They're inherently readonly, so
 * cannot set an "answer".
 */
export class NoteQuestionEvent extends QuestionEvent<'note'> {
	getAnswer(): NoteNodeAnswer {
		return new NoteNodeAnswer(this.node);
	}

	answerQuestion(_answerValue: unknown): ValueNodeAnswer {
		throw new Error("Cannot set answer value of readonly node: type is 'note'");
	}
}
