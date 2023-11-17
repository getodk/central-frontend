import { RepeatDefinition } from '../body/RepeatDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import type { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class RepeatInstanceDefinition implements NodeDefinition<'repeat-instance'> {
	readonly type = 'repeat-instance';

	readonly root: RootDefinition;
	readonly children: readonly ChildNodeDefinition[];

	constructor(
		protected readonly sequence: RepeatSequenceDefinition,
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		readonly bodyElement: RepeatDefinition,
		readonly node: Element,
		protected index: number
	) {
		const { root } = parent;

		this.bind = bind;
		this.bodyElement = bodyElement;
		this.root = root;
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, sequence, ...rest } = this;

		return rest;
	}
}
