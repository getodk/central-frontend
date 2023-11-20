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
	readonly parent: ParentNodeDefinition;
	readonly bind: BindDefinition;
	readonly bodyElement: RepeatDefinition;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;

	constructor(
		protected readonly sequence: RepeatSequenceDefinition,
		readonly node: Element
	) {
		const {
			bind,
			bodyElement: repeatGroupBodyElement,
			parent: repeatSequenceParent,
			root,
		} = sequence;

		this.root = root;
		this.parent = repeatSequenceParent;
		this.bind = bind;
		this.bodyElement = repeatGroupBodyElement.repeat;
		this.children = root.buildSubtree(this);
	}

	toJSON() {
		const { bind, bodyElement, parent, root, sequence, ...rest } = this;

		return rest;
	}
}
