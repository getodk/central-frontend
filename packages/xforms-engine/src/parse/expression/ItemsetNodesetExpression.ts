import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemsetNodesetExpression extends DependentExpression<'nodes'> {
	constructor(nodesetExpression: string) {
		super('nodes', nodesetExpression);
	}
}
