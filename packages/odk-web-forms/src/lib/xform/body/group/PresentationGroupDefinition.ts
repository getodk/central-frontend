import type { XFormDefinition } from '../../XFormDefinition.ts';
import { LabelDefinition } from '../text/LabelDefinition.ts';
import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class PresentationGroupDefinition extends BaseGroupDefinition<'presentation-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'presentation-group';
	}

	readonly type = 'presentation-group';

	override readonly label: LabelDefinition;

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);

		const label = LabelDefinition.forElement(form, element);

		if (label == null) {
			throw new Error('Invalid presentation-group: missing label');
		}

		this.label = label;
	}
}

export type PresentationGroupDefinitionClass = typeof PresentationGroupDefinition;
