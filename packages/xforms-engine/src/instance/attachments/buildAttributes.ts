import { Attribute } from '../Attribute';
import type { AnyParentNode } from '../hierarchy';

export function buildAttributes(parent: AnyParentNode): Attribute[] {
	return Array.from(parent.definition.attributes.values()).map((attributeDefinition) => {
		return new Attribute(parent, attributeDefinition, attributeDefinition.template);
	});
}
