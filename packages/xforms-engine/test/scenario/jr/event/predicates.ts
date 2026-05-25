import type { QuestionNodeType } from './QuestionEvent.ts';
import type { AnyPositionalEvent, AnyQuestionEvent } from './getPositionalEvents.ts';

export const isQuestionEvent = (event: AnyPositionalEvent): event is AnyQuestionEvent => {
	return event.eventType === 'QUESTION';
};

export type TypedQuestionEvent<Type extends QuestionNodeType> = Extract<
	AnyQuestionEvent,
	{ readonly node: { readonly nodeType: Type } }
>;

export const isQuestionEventOfType = <Type extends QuestionNodeType>(
	event: AnyPositionalEvent,
	questionType: Type | null
): event is TypedQuestionEvent<Type> => {
	if (!isQuestionEvent(event)) {
		return false;
	}

	return questionType == null || event.node.nodeType === questionType;
};
