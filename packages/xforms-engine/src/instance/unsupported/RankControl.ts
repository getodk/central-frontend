import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';

export class RankControl extends UnsupportedControl<'rank'> {
	readonly nodeType = 'rank';
}
