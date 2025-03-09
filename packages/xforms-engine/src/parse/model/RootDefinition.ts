import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { BodyClassList } from '../body/BodyDefinition.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { LeafNodeDefinition } from './LeafNodeDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type { ChildNodeDefinition, ParentNodeDefinition } from './NodeDefinition.ts';
import { NodeDefinition } from './NodeDefinition.ts';
import { NoteNodeDefinition } from './NoteNodeDefinition.ts';
import { RangeNodeDefinition } from './RangeNodeDefinition.ts';
import { RepeatDefinition } from './RepeatDefinition.ts';
import { RootAttributeMap } from './RootAttributeMap.ts';
import type { SubmissionDefinition } from './SubmissionDefinition.ts';
import { SubtreeDefinition } from './SubtreeDefinition.ts';

export class RootDefinition extends NodeDefinition<'root'> {
	readonly type = 'root';
	readonly qualifiedName: QualifiedName;
	readonly bodyElement = null;
	readonly root = this;
	readonly parent = null;
	readonly template: StaticElement;
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly attributes: RootAttributeMap;
	readonly children: readonly ChildNodeDefinition[];

	readonly isTranslated = false;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition,
		readonly submission: SubmissionDefinition,
		readonly classes: BodyClassList
	) {
		const template = model.instance.root;
		const qualifiedName = template.qualifiedName;
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
		this.template = template;
		this.attributes = RootAttributeMap.from(this, template);
		this.namespaceDeclarations = new NamespaceDeclarationMap(this);
		this.children = this.buildSubtree(this, template);
	}

	buildSubtree(parent: ParentNodeDefinition, node: StaticElement): readonly ChildNodeDefinition[] {
		const { form, model } = this;
		const { body } = form;
		const { binds } = model;
		const { bind: parentBind } = parent;
		const { nodeset: parentNodeset } = parentBind;

		const childrenByName = new Map<string, [StaticElement, ...StaticElement[]]>();

		for (const child of node.childElements) {
			const nodeName = child.qualifiedName.getPrefixedName();

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
				return RepeatDefinition.from(parent, bind, bodyElement, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;

			if (element.isLeafElement()) {
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
