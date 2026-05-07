import type { AnyPositionalEvent } from '../event/getPositionalEvents.ts';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow minimal change to APIs called in ported tests.
 */
export class JRFormIndex {
	constructor(private readonly event: AnyPositionalEvent) {}

	isEndOfFormIndex(): boolean {
		return this.event.eventType === 'END_OF_FORM';
	}
}
