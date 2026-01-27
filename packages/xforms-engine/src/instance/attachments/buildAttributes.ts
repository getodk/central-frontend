import { Attribute } from '../Attribute';
import type { AnyNode } from '../hierarchy.ts';
import type { InputControl } from '../InputControl.ts';
import type { ModelValue } from '../ModelValue.ts';
import type { Note } from '../Note.ts';
import type { RangeControl } from '../RangeControl.ts';

export function buildAttributes(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	owner: AnyNode | InputControl<any> | ModelValue<any> | Note<any> | RangeControl<any>
): Attribute[] {
	const attributes = owner.definition.attributes;
	if (!attributes) {
		return [];
	}
	return Array.from(attributes.values()).map((attributeDefinition) => {
		return new Attribute(owner, attributeDefinition, attributeDefinition.template);
	});
}
