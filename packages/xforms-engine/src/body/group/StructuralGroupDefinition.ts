import { BaseGroupDefinition } from './BaseGroupDefinition.ts';

export class StructuralGroupDefinition extends BaseGroupDefinition<'structural-group'> {
	static override isCompatible(localName: string, element: Element): boolean {
		return this.getGroupType(localName, element) === 'structural-group';
	}

	readonly type = 'structural-group';
}

export type StructuralGroupDefinitionClass = typeof StructuralGroupDefinition;
