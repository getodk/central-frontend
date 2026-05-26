import { PositionalEvent } from './PositionalEvent.ts';

export class GroupEvent extends PositionalEvent<'GROUP'> {
	readonly eventType = 'GROUP';
}
