import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemsetNodesetExpression extends DependentExpression<'nodes'> {
	constructor(itemset: ItemsetDefinition, nodesetExpression: string) {
		super(itemset.parent, 'nodes', nodesetExpression);
	}
}
