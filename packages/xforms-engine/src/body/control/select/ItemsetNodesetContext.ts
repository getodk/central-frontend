import { DependencyContext } from '../../../expression/DependencyContext.ts';
import type { AnyDependentExpression } from '../../../expression/DependentExpression.ts';
import type { ItemsetDefinition } from './ItemsetDefinition.ts';

export class ItemsetNodesetContext extends DependencyContext {
	override readonly parentReference = null;
	override readonly reference: string;

	constructor(
		protected readonly itemset: ItemsetDefinition,
		nodesetExpression: string
	) {
		super();

		this.reference = nodesetExpression;
	}

	override set isTranslated(value: true) {
		super.isTranslated = value;
		this.itemset.isTranslated = value;
	}

	override registerDependentExpression(expression: AnyDependentExpression): void {
		this.itemset.registerDependentExpression(expression);
	}
}
