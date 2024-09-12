import type { ItemsetDefinition } from '../body/control/select/ItemsetDefinition.ts';
import { DependentExpression } from './DependentExpression.ts';

export class ItemsetNodesetExpression extends DependentExpression<'nodes'> {
	constructor(itemset: ItemsetDefinition, nodesetExpression: string) {
		super(itemset.parent, 'nodes', nodesetExpression);
	}
}
