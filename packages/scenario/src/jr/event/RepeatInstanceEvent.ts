import type { RepeatInstanceNode } from '@getodk/xforms-engine';
import { PositionalEvent } from './PositionalEvent.ts';

export class RepeatInstanceEvent extends PositionalEvent<'REPEAT'> {
	readonly eventType = 'REPEAT';

	constructor(override readonly node: RepeatInstanceNode) {
		super(node);
	}
}
