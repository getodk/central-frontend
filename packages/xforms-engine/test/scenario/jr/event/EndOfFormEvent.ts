import { PositionalEvent } from './PositionalEvent.ts';

export class EndOfFormEvent extends PositionalEvent<'END_OF_FORM'> {
	readonly eventType = 'END_OF_FORM';
}
