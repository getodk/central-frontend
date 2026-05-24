import { PositionalEvent } from './PositionalEvent.ts';

export class PromptNewRepeatEvent extends PositionalEvent<'PROMPT_NEW_REPEAT'> {
	readonly eventType = 'PROMPT_NEW_REPEAT';
}
