import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';
import type { AnyControlDefinition } from '../body/control/ControlDefinition.ts';
import { ControlDefinition } from '../body/control/ControlDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { NodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class ValueNodeDefinition implements NodeDefinition<'value-node'> {
	readonly type = 'value-node';

	readonly root: RootDefinition;
	readonly children = null;
	readonly instances = null;

	// TODO: it seems like a safe assumption that a model leaf node may only have
	// a body control, not a group/repeat, but is it actually?
	readonly bodyElement: AnyControlDefinition | null;

	constructor(
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		readonly node: Element
	) {
		this.root = parent.root;
		this.bind = bind;

		if (bodyElement == null || bodyElement instanceof ControlDefinition) {
			this.bodyElement = bodyElement;
		} else {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
