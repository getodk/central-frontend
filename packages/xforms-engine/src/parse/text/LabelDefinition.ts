import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { AnyGroupElementDefinition } from '../../body/BodyDefinition.ts';
import type { RepeatElementDefinition } from '../../body/RepeatElementDefinition.ts';
import type { AnyControlDefinition } from '../../body/control/ControlDefinition.ts';
import type { BaseGroupDefinition } from '../../body/group/BaseGroupDefinition.ts';
import { getLabelElement, getRepeatGroupLabelElement } from '../../lib/dom/query.ts';
import { TextElementDefinition } from './abstract/TextElementDefinition.ts';

// prettier-ignore
export type LabelOwner =
	| AnyControlDefinition
	| AnyGroupElementDefinition
	| RepeatElementDefinition;

interface LabelElement extends LocalNamedElement<'label'> {}

export class LabelDefinition extends TextElementDefinition<'label'> {
	static forControl(form: XFormDefinition, control: AnyControlDefinition): LabelDefinition | null {
		const labelElement = getLabelElement(control.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, control, labelElement);
	}

	static forRepeatGroup(
		form: XFormDefinition,
		repeat: RepeatElementDefinition
	): LabelDefinition | null {
		const repeatGroupLabel = getRepeatGroupLabelElement(repeat.element);

		if (repeatGroupLabel == null) {
			return null;
		}

		return new this(form, repeat, repeatGroupLabel);
	}

	static forGroup(
		form: XFormDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		group: BaseGroupDefinition<any>
	): LabelDefinition | null {
		const labelElement = getLabelElement(group.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, group, labelElement);
	}

	readonly role = 'label';

	private constructor(form: XFormDefinition, owner: LabelOwner, element: LabelElement) {
		super(form, owner, element);
	}
}
