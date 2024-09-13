import { UnsupportedControl } from '../abstract/UnsupportedControl.ts';

export class UploadControl extends UnsupportedControl<'upload'> {
	readonly nodeType = 'upload';
}
