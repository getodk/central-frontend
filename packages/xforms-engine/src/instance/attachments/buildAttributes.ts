import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { Attribute } from '../Attribute';
import type { AnyNode } from '../hierarchy.ts';
import type { InputControl } from '../InputControl.ts';
import type { ModelValue } from '../ModelValue.ts';
import type { Note } from '../Note.ts';
import type { RangeControl } from '../RangeControl.ts';

function buildInstanceAttributeMap(
	instanceNode: StaticAttribute | StaticDocument | StaticElement | null
): Map<string, StaticAttribute> {
	const map = new Map<string, StaticAttribute>();
	if (!instanceNode) {
		return map;
	}
	for (const attribute of instanceNode.attributes) {
		map.set(attribute.qualifiedName.getPrefixedName(), attribute);
	}
	return map;
}

export function buildAttributes(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	owner: AnyNode | InputControl<any> | ModelValue<any> | Note<any> | RangeControl<any>
): Attribute[] {
	const attributes = owner.definition.attributes;
	if (!attributes) {
		return [];
	}
	const instanceAttributes = buildInstanceAttributeMap(owner.instanceNode);
	return Array.from(attributes.values()).map((attributeDefinition) => {
		const instanceNode =
			instanceAttributes.get(attributeDefinition.qualifiedName.getPrefixedName()) ??
			attributeDefinition.template;
		return new Attribute(owner, attributeDefinition, instanceNode);
	});
}
