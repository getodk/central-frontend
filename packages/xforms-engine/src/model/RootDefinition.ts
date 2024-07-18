import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyClassList } from '../body/BodyDefinition.ts';
import { NoteNodeDefinition } from '../parse/NoteNodeDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import { RepeatRangeDefinition } from './RepeatRangeDefinition.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';

export class RootDefinition implements NodeDefinition<'root'> {
	readonly type = 'root';
	readonly bind: BindDefinition;
	readonly nodeset: string;
	readonly nodeName: string;
	readonly bodyElement = null;
	readonly root = this;
	readonly parent = null;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly node: Element;
	readonly defaultValue = null;

	readonly isTranslated = false;
	readonly dependencyExpressions: ReadonlySet<string> = new Set<string>();

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly classes: BodyClassList
	) {
		// TODO: theoretically the pertinent step in the bind's `nodeset` *could* be
		// namespaced. It also may make more sense to determine the root nodeset
		// earlier (i.e. in the appropriate definition class).
		//
		// TODO: while it's unlikely a form actually defines a <bind> for the root,
		// if it did, bind nodesets are not yet normalized, so `/root` may currently
		// be defined as `/ root` (or even `/ *` or any other valid expression
		// resolving to the root).
		const { primaryInstanceRoot } = form.xformDOM;
		const { localName: rootNodeName } = primaryInstanceRoot;

		this.nodeName = rootNodeName;

		const nodeset = `/${rootNodeName}`;
		const bind = model.binds.get(nodeset);

		if (bind == null) {
			throw new Error('Missing root node bind definition');
		}

		this.bind = bind;
		this.nodeset = nodeset;
		this.node = primaryInstanceRoot;
		this.children = this.buildSubtree(this);
	}

	buildSubtree(parent: ParentNodeDefinition): readonly ChildNodeDefinition[] {
		const { form, model } = this;
		const { body } = form;
		const { binds } = model;
		const { bind: parentBind, node } = parent;
		const { nodeset: parentNodeset } = parentBind;

		const childrenByName = new Map<string, [Element, ...Element[]]>();

		for (const child of node.children) {
			const { localName } = child;

			let elements = childrenByName.get(localName);

			if (elements == null) {
				elements = [child];
				childrenByName.set(localName, elements);
			} else {
				// TODO: check if previous element exists, was it previous element
				// sibling. Highly likely this should otherwise fail!
				elements.push(child);
			}
		}

		return Array.from(childrenByName).map(([localName, children]) => {
			const nodeset = `${parentNodeset}/${localName}`;
			const bind = binds.getOrCreateBindDefinition(nodeset);
			const bodyElement = body.getBodyElement(nodeset);
			const [firstChild, ...restChildren] = children;

			if (bodyElement?.type === 'repeat') {
				return new RepeatRangeDefinition(parent, bind, bodyElement, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;
			const isLeafNode = element.childElementCount === 0;

			if (isLeafNode) {
				return (
					NoteNodeDefinition.from(parent, bind, bodyElement, element) ??
					new LeafNodeDefinition(parent, bind, bodyElement, element)
				);
			}

			return new SubtreeDefinition(parent, bind, bodyElement, element);
		});
	}

	toJSON() {
		const { bind, bodyElement, form, model, root, ...rest } = this;

		return rest;
	}
}
