import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { BodyClassList } from '../body/BodyDefinition.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { FormSubmissionDefinition } from './FormSubmissionDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type { ChildNodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import { NodeDefinition } from './NodeDefinition.ts';
import { NoteNodeDefinition } from './NoteNodeDefinition.ts';
import { RangeNodeDefinition } from './RangeNodeDefinition.ts';
import { RepeatRangeDefinition } from './RepeatRangeDefinition.ts';
import { RootAttributeMap } from './RootAttributeMap.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';

export class RootDefinition extends NodeDefinition<'root'> {
	readonly type = 'root';
	readonly qualifiedName: QualifiedName;
	readonly bodyElement = null;
	readonly root = this;
	readonly parent = null;
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly attributes: RootAttributeMap;
	readonly children: readonly ChildNodeDefinition[];
	readonly instances = null;
	readonly node: Element;
	readonly defaultValue = null;

	readonly isTranslated = false;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly submission: FormSubmissionDefinition,
		readonly classes: BodyClassList
	) {
		const { primaryInstanceRoot } = form.xformDOM;
		const qualifiedName = new QualifiedName(primaryInstanceRoot);
		const nodeName = qualifiedName.getPrefixedName();

		// TODO: theoretically the pertinent step in the bind's `nodeset` *could* be
		// namespaced. It also may make more sense to determine the root nodeset
		// earlier (i.e. in the appropriate definition class).
		const nodeset = `/${nodeName}`;
		const bind = model.binds.get(nodeset);

		if (bind == null) {
			throw new Error('Missing root node bind definition');
		}

		super(bind);

		this.qualifiedName = qualifiedName;
		this.node = primaryInstanceRoot;
		this.attributes = RootAttributeMap.from(this, primaryInstanceRoot);
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
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
			const { nodeName } = child;

			let elements = childrenByName.get(nodeName);

			if (elements == null) {
				elements = [child];
				childrenByName.set(nodeName, elements);
			} else {
				// TODO: check if previous element exists, was it previous element
				// sibling. Highly likely this should otherwise fail!
				elements.push(child);
			}
		}

		return Array.from(childrenByName).map(([nodeName, children]) => {
			const nodeset = `${parentNodeset}/${nodeName}`;
			const bind = binds.getOrCreateBindDefinition(nodeset);
			const bodyElement = body.getBodyElement(nodeset);
			const [firstChild, ...restChildren] = children;

			if (bodyElement?.type === 'repeat') {
				return RepeatRangeDefinition.from(parent, bind, bodyElement, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;
			const isLeafNode = element.childElementCount === 0;

			if (isLeafNode) {
				if (bodyElement?.type === 'range') {
					return RangeNodeDefinition.from(parent, bind, bodyElement, element);
				}

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
