import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { InputAppearanceDefinition } from '../appearance/inputAppearanceParser.ts';
import { inputAppearanceParser } from '../appearance/inputAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class InputControlDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	readonly type = 'input';
	readonly appearances: InputAppearanceDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = inputAppearanceParser.parseFrom(element, 'appearance');
	}
}
