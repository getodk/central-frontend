import { DependentExpression } from '../../../expression/DependentExpression.ts';
import type { ItemsetDefinition } from './ItemsetDefinition.ts';

export class ItemsetValueExpression extends DependentExpression<'string'> {
	constructor(
		readonly itemset: ItemsetDefinition,
		expression: string
	) {
		super(itemset, 'string', expression);
	}
}
