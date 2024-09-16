import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';

export class RangeControl extends UnsupportedControl<'range'> {
	readonly nodeType = 'range';
}
