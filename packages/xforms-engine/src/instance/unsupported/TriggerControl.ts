import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';

export class TriggerControl extends UnsupportedControl<'trigger'> {
	readonly nodeType = 'trigger';
}
