import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { InputDefinition } from '../client/InputNode.ts';
import type { ModelValueDefinition } from '../client/ModelValueNode.ts';
import type { RankDefinition } from '../client/RankNode.ts';
import type { SelectDefinition } from '../client/SelectNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
import type { TriggerNodeDefinition } from '../client/TriggerNode.ts';
import type { UploadNodeDefinition } from '../client/unsupported/UploadNode.ts';
import { ErrorProductionDesignPendingError } from '../error/ErrorProductionDesignPendingError.ts';
import type { StaticDocument } from '../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../integration/xpath/static-dom/StaticElement.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { NodeDefinition } from '../parse/model/NodeDefinition.ts';
import { NoteNodeDefinition } from '../parse/model/NoteNodeDefinition.ts';
import type {
	AnyRangeNodeDefinition,
	RangeLeafNodeDefinition,
} from '../parse/model/RangeNodeDefinition.ts';
import { RangeNodeDefinition } from '../parse/model/RangeNodeDefinition.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../parse/model/SubtreeDefinition.ts';
import type { InstanceNode } from './abstract/InstanceNode.ts';
import { Group } from './Group.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import { InputControl } from './InputControl.ts';
import { ModelValue } from './ModelValue.ts';
import { Note } from './Note.ts';
import { RangeControl } from './RangeControl.ts';
import { RankControl } from './RankControl.ts';
import { RepeatRangeControlled } from './repeat/RepeatRangeControlled.ts';
import { RepeatRangeUncontrolled } from './repeat/RepeatRangeUncontrolled.ts';
import { SelectControl } from './SelectControl.ts';
import { Subtree } from './Subtree.ts';
import { TriggerControl } from './TriggerControl.ts';
import { UploadControl } from './unsupported/UploadControl.ts';

type InstanceNodesByNodeset = ReadonlyMap<string, readonly [StaticElement, ...StaticElement[]]>;

const groupChildElementsByNodeset = (
	parent: StaticDocument | StaticElement
): InstanceNodesByNodeset => {
	const result = new Map<string, [StaticElement, ...StaticElement[]]>();

	for (const child of parent.childElements) {
		const { nodeset } = child;
		const group = result.get(nodeset);

		if (group == null) {
			result.set(nodeset, [child]);
		} else {
			group.push(child);
		}
	}

	return result;
};

const isSubtreeDefinition = (
	definition: ModelSubtreeDefinition
): definition is SubtreeDefinition => {
	return definition.bodyElement == null;
};

// prettier-ignore
type AnyUnsupportedControlDefinition = UploadNodeDefinition;

// prettier-ignore
type ControlNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| InputDefinition
	| RangeLeafNodeDefinition
	| SelectDefinition
	| RankDefinition
	| TriggerNodeDefinition
	| AnyUnsupportedControlDefinition;

type AnyLeafNodeDefinition = ControlNodeDefinition | ModelValueDefinition;

const isModelValueDefinition = (
	definition: LeafNodeDefinition
): definition is ModelValueDefinition => {
	return definition.bodyElement == null;
};

const isInputDefinition = (definition: ControlNodeDefinition): definition is InputDefinition => {
	return definition.bodyElement.type === 'input';
};

const isSelectDefinition = (definition: ControlNodeDefinition): definition is SelectDefinition => {
	return definition.bodyElement.type === 'select' || definition.bodyElement.type === 'select1';
};

const isRankDefinition = (definition: ControlNodeDefinition): definition is RankDefinition => {
	return definition.bodyElement.type === 'rank';
};

const isRangeLeafNodeDefinition = (
	definition: ControlNodeDefinition
): definition is RangeLeafNodeDefinition => {
	return definition.bodyElement.type === 'range';
};

type AssertRangeNodeDefinition = (
	definition: RangeLeafNodeDefinition
) => asserts definition is AnyRangeNodeDefinition;

/**
 * We need some way to narrow the base {@link RangeLeafNodeDefinition} type to
 * {@link RankNodeDefinition} type.
 *
 * At time of writing, we know there is no code path to produce the broader
 * type, but appeasing the type checker for it will help guard against
 * introducing one. (And it would have caught exactly such a mistake in this
 * phase of development, where a more optimistic type cast did not.)
 *
 * An `instanceof` check is appropriate because the narrower type refines all of
 * the following:
 *
 * - `valueType` is a subset of the full range of
 *   {@link ValueType | specified value types} (only `int` or `decimal` are
 *   supported for range controls)
 *
 * - addition of range-specific properties: `min`, `max`, `step`
 */
const assertRangeNodeDefinition: AssertRangeNodeDefinition = (definition) => {
	if (definition instanceof RangeNodeDefinition) {
		return;
	}

	/**
	 * At time of writing we know there is no code path producing this
	 * case, but appeasing the type checker for it now will guard against
	 * it happening mistakenly in any future refactoring. (Hint: it
	 * occurred during some refactoring that arrived here, which is why
	 * this isn't a type cast!)
	 */
	throw new ErrorProductionDesignPendingError(
		`Invalid <range> definition with value type: ${definition.valueType}`
	);
};

const isTriggerNodeDefinition = (
	definition: ControlNodeDefinition
): definition is TriggerNodeDefinition => {
	return definition.bodyElement.type === 'trigger';
};

const isUploadNodeDefinition = (
	definition: ControlNodeDefinition
): definition is UploadNodeDefinition => {
	return definition.bodyElement.type === 'upload';
};

export const buildChildren = (parent: GeneralParentNode): GeneralChildNode[] => {
	/**
	 * Child nodesets are collected from the {@link parent}'s
	 * {@link NodeDefinition.template}, ensuring that we produce
	 * {@link InstanceNode}s for every **model-defined** node, even if a
	 * corresponding node was not serialized in a {@link parent.instanceNode}.
	 *
	 * In other words, by referencing the model-defined template, we are able to
	 * reproduce nodes which were omitted as non-relevant in a prior serialization
	 * and/or submission.
	 */
	const childNodesets = Array.from(
		new Set(
			parent.definition.template.childElements.map((childElement) => {
				return childElement.nodeset;
			})
		)
	);

	let instanceChildrenByNodeset: InstanceNodesByNodeset | null;

	if (parent.instanceNode == null) {
		instanceChildrenByNodeset = null;
	} else {
		instanceChildrenByNodeset = groupChildElementsByNodeset(parent.instanceNode);
	}

	const { model } = parent.rootDocument;

	return childNodesets.map((nodeset): GeneralChildNode => {
		/**
		 * Get children of the target nodeset from {@link parent.instanceNode}, if
		 * that node exists, and if children with that nodeset exist.
		 *
		 * If either does not exist (e.g. it was omitted as non-relevant in a prior
		 * serialization), we continue to reference model-defined templates as we
		 * recurse down the {@link InstanceNode} subtree.
		 *
		 * @see {@link childNodesets}
		 */
		const instanceNodes = instanceChildrenByNodeset?.get(nodeset) ?? [];
		const [instanceNode = null] = instanceNodes;

		const definition = model.getNodeDefinition(nodeset);

		switch (definition.type) {
			case 'root': {
				throw new ErrorProductionDesignPendingError();
			}

			case 'subtree': {
				if (isSubtreeDefinition(definition)) {
					return new Subtree(parent, instanceNode, definition);
				}

				// TODO: it'd be good to be able to do without this type assertion. The
				// only distinction between the types is whether `bodyElement` is
				// `null`, but for some reason that's insufficient to narrow the union.
				return new Group(parent, instanceNode, definition as GroupDefinition);
			}

			case 'repeat': {
				if (definition.isControlled()) {
					return new RepeatRangeControlled(parent, instanceNodes, definition);
				}

				return new RepeatRangeUncontrolled(parent, instanceNodes, definition);
			}

			case 'leaf-node': {
				if (instanceNode != null && !instanceNode.isLeafElement()) {
					throw new ErrorProductionDesignPendingError();
				}

				if (definition instanceof NoteNodeDefinition) {
					return new Note(parent, instanceNode, definition);
				}

				// More specific type helps with narrowing below
				const leafChild: AnyLeafNodeDefinition = definition;

				if (isModelValueDefinition(leafChild)) {
					return ModelValue.from(parent, instanceNode, leafChild);
				}

				if (isInputDefinition(leafChild)) {
					return InputControl.from(parent, instanceNode, leafChild);
				}

				if (isSelectDefinition(leafChild)) {
					return SelectControl.from(parent, instanceNode, leafChild);
				}

				if (isRankDefinition(leafChild)) {
					return RankControl.from(parent, instanceNode, leafChild);
				}

				if (isTriggerNodeDefinition(leafChild)) {
					return TriggerControl.from(parent, instanceNode, leafChild);
				}

				if (isRangeLeafNodeDefinition(leafChild)) {
					assertRangeNodeDefinition(leafChild);

					return RangeControl.from(parent, instanceNode, leafChild);
				}

				if (isUploadNodeDefinition(leafChild)) {
					return new UploadControl(parent, instanceNode, leafChild);
				}

				throw new UnreachableError(leafChild);
			}

			default: {
				throw new UnreachableError(definition);
			}
		}
	});
};
