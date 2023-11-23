import type {
	AnyBodyElementDefinition,
	NonRepeatGroupElementDefinition,
} from '../body/BodyDefinition.ts';
import { LogicalGroupDefinition } from '../body/group/LogicalGroupDefinition.ts';
import { PresentationGroupDefinition } from '../body/group/PresentationGroupDefinition.ts';
import { StructuralGroupDefinition } from '../body/group/StructuralGroupDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export class SubtreeDefinition implements NodeDefinition<'subtree'> {
	readonly type = 'subtree';

	readonly nodeName: string;
	readonly bodyElement: NonRepeatGroupElementDefinition | null;

	readonly root: RootDefinition;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly defaultValue = null;

	constructor(
		readonly parent: ParentNodeDefinition,
		readonly bind: BindDefinition,
		bodyElement: AnyBodyElementDefinition | null,
		readonly node: Element
	) {
		const { root } = parent;

		this.nodeName = node.localName;
		this.root = root;
		this.children = root.buildSubtree(this);
		this.bind = bind;

		if (
			bodyElement == null ||
			bodyElement instanceof LogicalGroupDefinition ||
			bodyElement instanceof PresentationGroupDefinition ||
			bodyElement instanceof StructuralGroupDefinition
		) {
			this.bodyElement = bodyElement;
		} else {
			throw new Error(`Unexpected body element for nodeset ${bind.nodeset}`);
		}
	}

	toJSON() {
		const { parent, bodyElement, bind, root, ...rest } = this;

		return rest;
	}
}
