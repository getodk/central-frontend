import { JAVAROSA_NAMESPACE_URI } from '@odk/common/constants/xmlns.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { RepeatGroupDefinition } from '../body/group/RepeatGroupDefinition.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';
import type {
	ChildNodeDefinition,
	NodeDefinition,
	ParentNodeDefinition,
} from './NodeDefinition.ts';
import { RepeatSequenceDefinition } from './RepeatSequenceDefinition.ts';
import { SubtreeNodeDefinition } from './SubtreeDefinition.ts';
import { ValueNodeDefinition } from './ValueNodeDefinition.ts';

export class RootDefinition implements NodeDefinition<'root'> {
	readonly type = 'root';
	readonly bind: BindDefinition;
	readonly bodyElement = null;
	readonly root = this;
	readonly parent = null;
	readonly children: readonly ChildNodeDefinition[];
	readonly node: Element;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
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
		const nodeset = `/${rootNodeName}`;
		const bind = model.binds.get(nodeset);

		if (bind == null) {
			throw new Error('Missing root node bind definition');
		}

		this.bind = bind;
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
				// TODO: check...
				//
				// 1. If previous element exists, was it previous element sibling
				// 2. If previous element exists, is this a repeat
				//
				// Highly likely this should otherwise fail!
				elements.push(child);
			}
		}

		return Array.from(childrenByName).map(([localName, children]) => {
			const nodeset = `${parentNodeset}/${localName}`;
			const bind = binds.get(nodeset);

			if (bind == null) {
				throw new Error(`No bind for node. Computed nodeset: ${nodeset}`);
			}

			const bodyElement = body.getBodyElement(nodeset);
			const [firstChild, ...restChildren] = children;
			const repeatGroup = body.getRepeatGroup(nodeset);

			if (repeatGroup != null) {
				const repeatDefinition = (bodyElement as RepeatGroupDefinition).repeat;

				if (repeatDefinition == null) {
					throw 'TODO: this is why I have hesitated to pick an "is repeat" predicate direction';
				}

				// TODO:
				//
				// 0. Alllll of this stuff probably doesn't belong here, can it be
				//    reasonably pushed down to `RepeatSequenceDefinition`?
				// 1. Track templates by nodeset, multiple nested instances, ugh...
				// 2. Should template derived from initial definition be emptied?
				const isFirstChildTemplate = firstChild.hasAttributeNS(JAVAROSA_NAMESPACE_URI, 'template');
				const templateElement = isFirstChildTemplate
					? firstChild
					: RepeatSequenceDefinition.createTemplateElement(firstChild);

				const defaultInstanceElements = isFirstChildTemplate ? restChildren : children;

				let instanceElements: readonly Element[] = defaultInstanceElements;

				const { countExpression, isFixedCount } = repeatDefinition;

				if (!isFixedCount && countExpression == null && instanceElements.length === 0) {
					instanceElements = [RepeatSequenceDefinition.createInstanceElement(templateElement)];
				}

				return new RepeatSequenceDefinition(parent, bind, repeatGroup, children);
			}

			if (restChildren.length) {
				throw new Error(`Unexpected: multiple elements for non-repeat nodeset: ${nodeset}`);
			}

			const element = firstChild;
			const isLeafNode = element.childElementCount === 0;

			if (isLeafNode) {
				return new ValueNodeDefinition(parent, bind, bodyElement, element);
			}

			return new SubtreeNodeDefinition(parent, bind, bodyElement, element);
		});
	}

	toJSON() {
		const { bind, bodyElement, form, model, root, ...rest } = this;

		return rest;
	}
}
