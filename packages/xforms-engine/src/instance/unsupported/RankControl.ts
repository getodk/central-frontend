import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';
import type { ValueContext } from '../internal-api/ValueContext.ts';

export class RankControl extends UnsupportedControl<'rank'> implements ValueContext<unknown> {
	readonly nodeType = 'rank';

	// ValueContext
	readonly contextNode = this;
}
