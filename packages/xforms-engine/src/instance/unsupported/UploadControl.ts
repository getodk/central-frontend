import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';
import type { ValueContext } from '../internal-api/ValueContext.ts';

export class UploadControl extends UnsupportedControl<'upload'> implements ValueContext<unknown> {
	readonly nodeType = 'upload';

	// ValueContext
	readonly contextNode = this;
}
