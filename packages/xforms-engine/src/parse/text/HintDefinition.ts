import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { AnyControlDefinition } from '../../body/control/ControlDefinition.ts';
import { getHintElement } from '../../lib/dom/query.ts';
import { TextElementDefinition } from './abstract/TextElementDefinition.ts';

interface HintElement extends LocalNamedElement<'hint'> {}

export class HintDefinition extends TextElementDefinition<'hint'> {
	static forElement(form: XFormDefinition, owner: AnyControlDefinition): HintDefinition | null {
		const hintElement = getHintElement(owner.element);

		if (hintElement == null) {
			return null;
		}

		return new this(form, owner, hintElement);
	}

	readonly role = 'hint';

	private constructor(form: XFormDefinition, owner: AnyControlDefinition, element: HintElement) {
		super(form, owner, element);
	}
}
