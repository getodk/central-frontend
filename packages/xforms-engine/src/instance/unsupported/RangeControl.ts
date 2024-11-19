import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';
import type { ValueContext } from '../internal-api/ValueContext.ts';

export class RangeControl extends UnsupportedControl<'range'> implements ValueContext<unknown> {
	readonly nodeType = 'range';

	// ValueContext
	readonly contextNode = this;
}
