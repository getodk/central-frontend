import type { XFormDefinition } from '../../XFormDefinition.ts';
import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class LogicalGroupDefinition extends BaseGroupDefinition<'logical-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'logical-group';
	}

	readonly type = 'logical-group';

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);
	}
}

export type LogicalGroupDefinitionClass = typeof LogicalGroupDefinition;
