import { DependentExpression } from '../../../expression/DependentExpression.ts';
import type { ItemsetDefinition } from './ItemsetDefinition.ts';

export class ItemsetNodesetExpression extends DependentExpression<'nodes'> {
	constructor(itemset: ItemsetDefinition, nodesetExpression: string) {
		super(itemset.parent, 'nodes', nodesetExpression);
	}
}
