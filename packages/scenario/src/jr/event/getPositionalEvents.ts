import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNode, RootNode } from '@getodk/xforms-engine';
import { collectFlatNodeList } from '../../client/traversal.ts';
import { BeginningOfFormEvent } from './BeginningOfFormEvent.ts';
import { EndOfFormEvent } from './EndOfFormEvent.ts';
import { GroupEvent } from './GroupEvent.ts';
import { NoteQuestionEvent } from './NoteQuestionEvent.ts';
import { PromptNewRepeatEvent } from './PromptNewRepeatEvent.ts';
import { RepeatInstanceEvent } from './RepeatInstanceEvent.ts';
import { SelectQuestionEvent } from './SelectQuestionEvent.ts';
import { StringInputQuestionEvent } from './StringInputQuestionEvent.ts';

// prettier-ignore
export type AnyQuestionEvent =
	| NoteQuestionEvent
	| SelectQuestionEvent
	| StringInputQuestionEvent;

// prettier-ignore
export type NonTerminalPositionalEvent =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| GroupEvent
	| RepeatInstanceEvent
	| PromptNewRepeatEvent
	| AnyQuestionEvent;

// prettier-ignore
export type AnyPositionalEvent =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| BeginningOfFormEvent
	| NonTerminalPositionalEvent
	| EndOfFormEvent;

// prettier-ignore
export type PositionalEvents = readonly [
	BeginningOfFormEvent,
	...NonTerminalPositionalEvent[],
	EndOfFormEvent,
];

type AnyRelevantNode = AnyNode & { readonly currentState: { readonly relevant: true } };

const isRelevant = (node: AnyNode): node is AnyRelevantNode => {
	return node.currentState.relevant === true;
};

export const getPositionalEvents = (instanceRoot: RootNode): PositionalEvents => {
	const beginning = BeginningOfFormEvent.from(instanceRoot);
	const nodes = collectFlatNodeList(instanceRoot);
	const relevantNodes = nodes.filter(isRelevant);
	const nonTerminalEvents = relevantNodes.flatMap(
		(node): NonTerminalPositionalEvent | readonly [] => {
			switch (node.nodeType) {
				case 'root':
				case 'subtree':
					return [];

				case 'repeat-instance':
					return RepeatInstanceEvent.from(node);

				case 'repeat-range':
					return PromptNewRepeatEvent.from(node);

				case 'group':
					return GroupEvent.from(node);

				case 'model-value':
					return [];

				case 'note':
					return NoteQuestionEvent.from(node);

				case 'select':
					return SelectQuestionEvent.from(node);

				case 'string':
					return StringInputQuestionEvent.from(node);

				default:
					throw new UnreachableError(node);
			}
		}
	);
	const end = EndOfFormEvent.from(null);

	return [beginning, ...nonTerminalEvents, end];
};
