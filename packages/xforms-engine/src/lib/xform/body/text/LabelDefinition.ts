import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getLabelElement } from '../../query.ts';
import type { AnyControlDefinition } from '../control/ControlDefinition.ts';
import type { ItemDefinition } from '../control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../control/select/ItemsetDefinition.ts';
import type { BaseGroupDefinition } from '../group/BaseGroupDefinition.ts';
import type { TextElement, TextElementOwner } from './TextElementDefinition.ts';
import { TextElementDefinition } from './TextElementDefinition.ts';

export interface LabelElement extends TextElement {
	readonly localName: 'label';
}

type StaticLabelContext = Exclude<TextElementOwner, ItemsetDefinition>;

export class LabelDefinition extends TextElementDefinition<'label'> {
	protected static staticDefinition(
		form: XFormDefinition,
		definition: StaticLabelContext
	): LabelDefinition | null {
		const labelElement = getLabelElement(definition.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, definition, labelElement);
	}

	static forControl(form: XFormDefinition, control: AnyControlDefinition): LabelDefinition | null {
		return this.staticDefinition(form, control);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static forGroup(form: XFormDefinition, group: BaseGroupDefinition<any>): LabelDefinition | null {
		return this.staticDefinition(form, group);
	}

	static forItem(form: XFormDefinition, item: ItemDefinition): LabelDefinition | null {
		return this.staticDefinition(form, item);
	}

	static forItemset(form: XFormDefinition, itemset: ItemsetDefinition): LabelDefinition | null {
		const labelElement = getLabelElement(itemset.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, itemset, labelElement);
	}

	readonly type = 'label';
}
