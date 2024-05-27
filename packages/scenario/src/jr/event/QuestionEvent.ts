import type { ComparableAnswer } from '../../answer/ComparableAnswer.ts';
import type { PositionalEventNode } from './PositionalEvent.ts';
import { PositionalEvent } from './PositionalEvent.ts';

export type QuestionNode = PositionalEventNode<'QUESTION'>;

export abstract class QuestionEvent<
	Question extends QuestionNode,
> extends PositionalEvent<'QUESTION'> {
	readonly eventType = 'QUESTION';

	constructor(override readonly node: Question) {
		super(node);
	}

	abstract getAnswer(): ComparableAnswer;

	abstract answerQuestion(answerValue: unknown): string;
}

export type AnyQuestionEvent = QuestionEvent<QuestionNode>;
