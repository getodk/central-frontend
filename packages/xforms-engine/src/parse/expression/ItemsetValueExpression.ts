import type { ItemsetDefinition } from '../body/control/select/ItemsetDefinition.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemsetValueExpression extends DependentExpression<'string'> {
	constructor(
		readonly itemset: ItemsetDefinition,
		expression: string
	) {
		super(itemset, 'string', expression);
	}
}
