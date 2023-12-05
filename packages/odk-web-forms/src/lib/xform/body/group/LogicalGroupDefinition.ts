import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class LogicalGroupDefinition extends BaseGroupDefinition<'logical-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'logical-group';
	}

	readonly type = 'logical-group';
}

export type LogicalGroupDefinitionClass = typeof LogicalGroupDefinition;
