import type { XFormDefinition } from '../../XFormDefinition.ts';
import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class StructuralGroupDefinition extends BaseGroupDefinition<'structural-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'structural-group';
	}

	readonly type = 'structural-group';

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);
	}
}

export type StructuralGroupDefinitionClass = typeof StructuralGroupDefinition;
