import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import {
	inputAppearanceParser,
	type InputAppearanceDefinition,
} from '../appearance/inputAppearanceParser.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class InputDefinition extends ControlDefinition<'input'> {
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
