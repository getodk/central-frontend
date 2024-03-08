import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { AnyControlDefinition } from '../body/control/ControlDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { NodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';

export class ValueNodeDefinition
	extends DescendentNodeDefinition<'value-node', AnyControlDefinition | null>
	implements NodeDefinition<'value-node'>
{
	readonly type = 'value-node';

	readonly nodeName: string;
	readonly children = null;
	readonly instances = null;
	readonly defaultValue: string;

	constructor(
		parent: ParentNodeDefinition,
		bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		readonly node: Element
	) {
		if (bodyElement != null && bodyElement.category !== 'control') {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}

		super(parent, bind, bodyElement);

		this.nodeName = node.localName;
		this.defaultValue = node.textContent ?? '';
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
