import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { InputAppearanceDefinition } from '../appearance/inputAppearanceParser.ts';
import { inputAppearanceParser } from '../appearance/inputAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { parseToFloat, parseToInteger } from '../../../lib/number-parsers.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class InputControlDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	readonly type = 'input';
	readonly appearances: InputAppearanceDefinition;
	readonly rows: number | null;
	readonly accuracyThreshold: number | null;
	readonly unacceptableAccuracyThreshold: number | null;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = inputAppearanceParser.parseFrom(element, 'appearance');
		this.rows = parseToInteger(element.getAttribute('rows'));
		this.accuracyThreshold = parseToFloat(element.getAttribute('accuracyThreshold'));
		this.unacceptableAccuracyThreshold = parseToFloat(
			element.getAttribute('unacceptableAccuracyThreshold')
		);
	}
}
