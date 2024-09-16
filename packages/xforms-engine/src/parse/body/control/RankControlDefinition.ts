import { ODK_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import {
	unknownAppearanceParser,
	type UnknownAppearanceDefinition,
} from '../appearance/unknownAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

export class RankControlDefinition extends ControlDefinition<'rank'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return localName === 'rank' && element.namespaceURI === ODK_NAMESPACE_URI;
	}

	readonly type = 'rank';
	readonly appearances: UnknownAppearanceDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');
	}

	override toJSON(): object {
		return {};
	}
}
