import { RepeatElementDefinition } from '../body/RepeatElementDefinition.ts';
import { DescendentNodeDefinition } from './DescendentNodeDefinition.ts';
import type { ChildNodeDefinition, NodeDefinition } from './NodeDefinition.ts';
import type { RepeatRangeDefinition } from './RepeatRangeDefinition.ts';

export class RepeatInstanceDefinition
	extends DescendentNodeDefinition<'repeat-instance', RepeatElementDefinition>
	implements NodeDefinition<'repeat-instance'>
{
	readonly type = 'repeat-instance';

	readonly nodeName: string;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		range: RepeatRangeDefinition,
		readonly node: Element
	) {
		const { bind, bodyElement, parent, root } = range;

		super(parent, bind, bodyElement);

		this.nodeName = range.nodeName;
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, ...rest } = this;

		return rest;
	}
}
