import { PositionalEvent } from './PositionalEvent.ts';

export class BeginningOfFormEvent extends PositionalEvent<'BEGINNING_OF_FORM'> {
	readonly eventType = 'BEGINNING_OF_FORM';
}
