import type { XFormDefinition } from '../../XFormDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class InputDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	override readonly category = 'control';
	readonly type = 'input';

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);
	}
}
