import type { XFormDefinition } from '../../XFormDefinition.ts';
import {
	unknownAppearanceParser,
	type UnknownAppearanceDefinition,
} from '../appearance/unknownAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class UploadControlDefinition extends ControlDefinition<'upload'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'upload';
	}

	readonly type = 'upload';
	readonly appearances: UnknownAppearanceDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');
	}

	override toJSON(): object {
		return {};
	}
}
