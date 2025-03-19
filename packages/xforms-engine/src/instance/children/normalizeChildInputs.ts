import {
	OPENROSA_XFORMS_NAMESPACE_URI,
	XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import type { GroupDefinition } from '../../client/GroupNode.ts';
import type { SubtreeDefinition } from '../../client/SubtreeNode.ts';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { NamespaceURL } from '../../lib/names/NamespaceURL.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import { LeafNodeDefinition } from '../../parse/model/LeafNodeDefinition.ts';
import type { ModelDefinition } from '../../parse/model/ModelDefinition.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../../parse/model/SubtreeDefinition.ts';
import type { XFormDOM } from '../../parse/XFormDOM.ts';
import type { Group } from '../Group.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
import type { Root } from '../Root.ts';
import type { Subtree } from '../Subtree.ts';
import type { InstanceNodeChildInput } from './collectChildInputs.ts';

const META_LOCAL_NAME = 'meta';
const INSTANCE_ID_LOCAL_NAME = 'instanceID';
const DEPRECATED_ID_LOCAL_NAME = 'deprecatedID';

type MetaLocalName = typeof META_LOCAL_NAME;

const META_NAMESPACE_URIS = [OPENROSA_XFORMS_NAMESPACE_URI, XFORMS_NAMESPACE_URI] as const;

type MetaNamespaceURIValue = (typeof META_NAMESPACE_URIS)[number];

interface MetaNamespaceURI extends NamespaceURL {
	readonly href: MetaNamespaceURIValue;
}

interface MetaNamespacedName extends QualifiedName {
	readonly namespaceURI: MetaNamespaceURI;
}

const isMetaNamespacedName = (
	qualifiedName: QualifiedName
): qualifiedName is MetaNamespacedName => {
	const namespaceURI = qualifiedName.namespaceURI?.href;

	return (
		namespaceURI != null && META_NAMESPACE_URIS.includes(namespaceURI as MetaNamespaceURIValue)
	);
};

interface MetaName extends MetaNamespacedName {
	readonly localName: MetaLocalName;
}

const isMetaName = (qualifiedName: QualifiedName): qualifiedName is MetaName => {
	return isMetaNamespacedName(qualifiedName) && qualifiedName.localName === META_LOCAL_NAME;
};

const isDirectRootDescendant = (parent: GeneralParentNode) => {
	return parent.parent === parent.root;
};

interface BaseMetaDefinition {
	readonly qualifiedName: MetaName;
}

const isBaseMetaDefinition = <T extends ModelSubtreeDefinition>(
	definition: T
): definition is BaseMetaDefinition & T => {
	return isMetaName(definition.qualifiedName);
};

interface MetaSubtreeDefinition extends SubtreeDefinition {
	readonly qualifiedName: MetaName;
}

interface MetaSubtree extends Subtree {
	readonly parent: Root;
	readonly definition: MetaSubtreeDefinition;
}

interface MetaGroupDefinition extends GroupDefinition {
	readonly qualifiedName: MetaName;
}

interface MetaGroup extends Group {
	readonly parent: Root;
	readonly definition: MetaGroupDefinition;
}

type MetaParent = MetaGroup | MetaSubtree;

const isMetaParent = (parent: GeneralParentNode): parent is MetaParent => {
	const { nodeType } = parent;

	return (
		(nodeType === 'subtree' || nodeType === 'group') &&
		isDirectRootDescendant(parent) &&
		isBaseMetaDefinition(parent.definition)
	);
};

interface EditModeInstance extends PrimaryInstance {
	readonly initializationMode: 'edit';
}

const isEditModeInstance = (
	primaryInstance: PrimaryInstance
): primaryInstance is EditModeInstance => {
	return primaryInstance.initializationMode === 'edit';
};

interface EditModeInstanceDescendant {
	readonly rootDocument: EditModeInstance;
}

type EditModeMetaParent = EditModeInstanceDescendant & MetaParent;

const isEditModeMetaParent = (parent: MetaParent): parent is EditModeMetaParent => {
	return isEditModeInstance(parent.rootDocument);
};

interface LeafNodeChildInput extends InstanceNodeChildInput {
	readonly instanceNodes: readonly [StaticLeafElement];
}

const isLeafNodeChildInput = (input: InstanceNodeChildInput): input is LeafNodeChildInput => {
	const { instanceNodes } = input;
	const [instanceNode, ...rest] = instanceNodes;

	return instanceNode != null && rest.length === 0 && instanceNode.isLeafElement();
};

interface BaseMetaLeafChildLookupResult {
	readonly currentIndex: number | null;
	readonly childInput: LeafNodeChildInput | null;
}

type FoundLookupResult<T> = {
	[K in keyof T]: NonNullable<T[K]>;
};

type NotFoundLookupResult<T> = {
	[K in keyof T]: null;
};

type MetaLeafChildLookupResult =
	| FoundLookupResult<BaseMetaLeafChildLookupResult>
	| NotFoundLookupResult<BaseMetaLeafChildLookupResult>;

const findMetaLeafChild = (
	parent: MetaParent,
	inputs: readonly InstanceNodeChildInput[],
	localName: string
): MetaLeafChildLookupResult => {
	const metaName = parent.definition.qualifiedName satisfies MetaName;
	const namespaceURI = metaName.namespaceURI.href satisfies MetaNamespaceURIValue;

	const result = Array.from(inputs.entries()).find(
		(entry): entry is [number, LeafNodeChildInput] => {
			const [, childInput] = entry;

			if (!isLeafNodeChildInput(childInput)) {
				return false;
			}

			const [instanceNode] = childInput.instanceNodes;
			const { qualifiedName } = instanceNode;

			return (
				qualifiedName.localName === localName && qualifiedName.namespaceURI?.href === namespaceURI
			);
		}
	);

	if (result == null) {
		return {
			currentIndex: null,
			childInput: null,
		};
	}

	const [currentIndex, childInput] = result;

	return {
		currentIndex,
		childInput,
	};
};

const getInstanceIDValue = (
	parent: MetaParent,
	inputs: readonly InstanceNodeChildInput[]
): string | null => {
	const { childInput } = findMetaLeafChild(parent, inputs, INSTANCE_ID_LOCAL_NAME);

	if (childInput == null) {
		return null;
	}

	const [instanceIDNode] = childInput.instanceNodes;

	return instanceIDNode.value satisfies string;
};

type AssertStaticLeafElement = (element: StaticElement) => asserts element is StaticLeafElement;

const assertStaticLeafElement: AssertStaticLeafElement = (element) => {
	if (!element.isLeafElement()) {
		throw new Error();
	}
};

/**
 * @todo this name and signature are general, for the same reasons as the TODO
 * on {@link populateDeprecatedID}.
 */
const buildMetaValueElement = (
	parent: MetaParent,
	localName: string,
	value: string
): StaticLeafElement => {
	const { qualifiedName, nodeset } = parent.definition;
	const { namespaceURI, prefix } = qualifiedName;
	const { root } = new StaticDocument({
		documentRoot: {
			name: {
				namespaceURI,
				prefix,
				localName,
			},
			children: [value],
		},
		nodesetPrefix: nodeset,
	});

	assertStaticLeafElement(root);

	return root;
};

const buildDeprecatedIDDefinition = (
	model: ModelDefinition,
	parent: EditModeMetaParent,
	instanceNode: StaticLeafElement
): LeafNodeDefinition => {
	const nodeset = instanceNode.nodeset;
	const bind = model.binds.getOrCreateBindDefinition(nodeset);

	return new LeafNodeDefinition(parent.definition, bind, null, instanceNode);
};

const buildDeprecatedIDInput = (
	model: ModelDefinition,
	parent: EditModeMetaParent,
	value: string
): InstanceNodeChildInput => {
	const instanceNode = buildMetaValueElement(parent, DEPRECATED_ID_LOCAL_NAME, value);
	const definition = buildDeprecatedIDDefinition(model, parent, instanceNode);

	return {
		childNodeset: instanceNode.nodeset,
		definition,
		instanceNodes: [instanceNode],
	};
};

const updateDeprecatedIDInput = (
	parent: EditModeMetaParent,
	input: LeafNodeChildInput,
	value: string
): InstanceNodeChildInput => {
	const instanceNode = buildMetaValueElement(parent, DEPRECATED_ID_LOCAL_NAME, value);

	return {
		childNodeset: input.childNodeset,
		definition: input.definition,
		instanceNodes: [instanceNode],
	};
};

/**
 * Should be: values.with(index, value)
 *
 * @todo update tsconfig.json `lib` throughout project!
 */
const replace = <T>(values: readonly T[], index: number, value: T): readonly T[] => {
	const results = values.slice();

	results.splice(index, 1, value);

	return results;
};

/**
 * @todo Whenever we have bandwidth to start migrating away from DOM usage in
 * {@link XFormDOM}, this is a good place to start for logic equivalent to the
 * hacky normalization for `instanceID`.
 */
const populateDeprecatedID = (
	model: ModelDefinition,
	parent: EditModeMetaParent,
	inputs: readonly InstanceNodeChildInput[]
): readonly InstanceNodeChildInput[] => {
	const value = getInstanceIDValue(parent, inputs);

	if (value == null) {
		return inputs;
	}

	const { currentIndex, childInput: currentDeprecatedIDInput } = findMetaLeafChild(
		parent,
		inputs,
		DEPRECATED_ID_LOCAL_NAME
	);

	if (currentIndex == null) {
		const deprecatedID = buildDeprecatedIDInput(model, parent, value);

		return inputs.concat(deprecatedID);
	}

	const deprecatedID = updateDeprecatedIDInput(parent, currentDeprecatedIDInput, value);

	return replace(inputs, currentIndex, deprecatedID);
};

const normalizeMetaChildInputs = (
	model: ModelDefinition,
	parent: MetaParent,
	inputs: readonly InstanceNodeChildInput[]
): readonly InstanceNodeChildInput[] => {
	if (isEditModeMetaParent(parent)) {
		return populateDeprecatedID(model, parent, inputs);
	}

	return inputs;
};

export const normalizeChildInputs = (
	model: ModelDefinition,
	parent: GeneralParentNode,
	inputs: readonly InstanceNodeChildInput[]
): readonly InstanceNodeChildInput[] => {
	if (isMetaParent(parent)) {
		return normalizeMetaChildInputs(model, parent, inputs);
	}

	return inputs;
};
