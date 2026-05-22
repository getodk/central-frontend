import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

export class ItemPropertyExpression extends DependentExpression<'string'> {
	static from(propertiesNodes: StaticElement[]) {
		return propertiesNodes.map((node: StaticElement) => new this(node.qualifiedName.localName));
	}

	constructor(propertyName: string) {
		super('string', propertyName);
	}
}
