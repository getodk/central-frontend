import type { ComparableAnswer } from '../../answer/ComparableAnswer.ts';
import type { PositionalEventNode } from './PositionalEvent.ts';
import { PositionalEvent } from './PositionalEvent.ts';

type QuestionNode = PositionalEventNode<'QUESTION'>;

export type QuestionNodeType = QuestionNode['nodeType'];

export type TypedQuestionNode<Type extends QuestionNodeType> = Extract<
	QuestionNode,
	{ readonly nodeType: Type }
>;

export abstract class QuestionEvent<
	Type extends QuestionNodeType,
> extends PositionalEvent<'QUESTION'> {
	readonly eventType = 'QUESTION';

	constructor(override readonly node: TypedQuestionNode<Type>) {
		super(node);
	}

	abstract getAnswer(): ComparableAnswer;

	abstract answerQuestion(answerValue: unknown): ComparableAnswer;
}

export type AnyQuestionEvent = QuestionEvent<QuestionNodeType>;
