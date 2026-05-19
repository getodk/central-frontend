import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyElementParentContext } from './BodyDefinition.ts';
import { BodyElementDefinition } from './BodyElementDefinition.ts';

export class UnsupportedBodyElementDefinition extends BodyElementDefinition<'UNSUPPORTED'> {
	static override isCompatible(): boolean {
		return true;
	}

	override readonly category = 'UNSUPPORTED';
	readonly type = 'UNSUPPORTED';
	override readonly reference: null = null;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);
	}
}
