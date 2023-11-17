import { getScopeChildBySelector } from '@odk/common/lib/dom/compatibility.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementDefinitionArray } from '../BodyDefinition.ts';
import { RepeatDefinition } from '../RepeatDefinition.ts';
import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class RepeatGroupDefinition extends BaseGroupDefinition<'repeat-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'repeat-group';
	}

	readonly type = 'repeat-group';

	readonly repeat: RepeatDefinition;

	get repeatChildren(): BodyElementDefinitionArray {
		return this.repeat.children;
	}

	constructor(form: XFormDefinition, element: Element) {
		// TODO: this has already been queried at least twice before reaching this
		// point!
		const repeat = getScopeChildBySelector(element, ':scope > repeat', 'repeat');

		// TODO: and as such, this should not happen
		if (repeat == null) {
			throw new Error('Invalid repeat-group');
		}

		super(form, element);

		const repeatDefinition = new RepeatDefinition(form, this, repeat);

		this.repeat = repeatDefinition;
	}
}

export type RepeatGroupDefinitionClass = typeof RepeatGroupDefinition;
