import type { ValueType } from '../../client/ValueType.ts';
import type { AnyBodyElementDefinition, ControlElementDefinition } from '../body/BodyDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ParentNodeDefinition } from './NodeDefinition.ts';

export class LeafNodeDefinition<V extends ValueType = ValueType> extends DescendentNodeDefinition<
	'leaf-node',
	ControlElementDefinition | null
> {
	readonly type = 'leaf-node';
	readonly valueType: V;

	readonly localName: string;
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

		this.valueType = bind.type.resolved satisfies ValueType as V;
		this.localName = node.localName;
		this.defaultValue = node.textContent ?? '';
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
