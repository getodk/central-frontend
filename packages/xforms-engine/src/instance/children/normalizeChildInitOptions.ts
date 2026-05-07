import {
	OPENROSA_XFORMS_NAMESPACE_URI,
	XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import type { GroupDefinition } from '../../client/GroupNode.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { NamespaceURL } from '../../lib/names/NamespaceURL.ts';
import type { QualifiedName } from '../../lib/names/QualifiedName.ts';
import type { GroupDefinition as ModelGroupDefinition } from '../../parse/model/GroupDefinition.ts';
import { LeafNodeDefinition } from '../../parse/model/LeafNodeDefinition.ts';
import type { XFormDOM } from '../../parse/XFormDOM.ts';
import type { Group } from '../Group.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
import type { Root } from '../Root.ts';
import type { ChildrenInitOptions } from './childrenInitOptions.ts';
import type { DescendantNodeInitOptions } from './DescendantNodeInitOptions.ts';

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

const isBaseMetaDefinition = <T extends ModelGroupDefinition>(
	definition: T
): definition is BaseMetaDefinition & T => {
	return isMetaName(definition.qualifiedName);
};

interface MetaGroupDefinition extends GroupDefinition {
	readonly qualifiedName: MetaName;
}

interface MetaGroup extends Group {
	readonly parent: Root;
	readonly definition: MetaGroupDefinition;
}

interface MetaGroupInitOptions extends ChildrenInitOptions {
	readonly parent: MetaGroup;
}

const isMetaGroup = (options: ChildrenInitOptions): options is MetaGroupInitOptions => {
	const { nodeType } = options.parent;

	return (
		nodeType === 'group' &&
		isDirectRootDescendant(options.parent) &&
		isBaseMetaDefinition(options.parent.definition)
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

type EditModeMetaGroup = EditModeInstanceDescendant & MetaGroup;

interface EditModeMetaGroupInitOptions extends MetaGroupInitOptions {
	readonly parent: EditModeMetaGroup;
}

const isEditModeMetaGroup = (
	group: MetaGroupInitOptions
): group is EditModeMetaGroupInitOptions => {
	return isEditModeInstance(group.parent.rootDocument);
};

interface LeafNodeInitOptions extends DescendantNodeInitOptions {
	readonly instanceNodes: readonly [StaticLeafElement];
}

const isLeafNodeInitOptions = (
	options: DescendantNodeInitOptions
): options is LeafNodeInitOptions => {
	const { instanceNodes } = options;
	const [instanceNode, ...rest] = instanceNodes;

	return instanceNode != null && rest.length === 0 && instanceNode.isLeafElement();
};

type MetaLeafChildEntry = readonly [index: number, child: LeafNodeInitOptions];

const findMetaLeafChild = (
	group: MetaGroupInitOptions,
	localName: string
): MetaLeafChildEntry | null => {
	const metaName = group.parent.definition.qualifiedName satisfies MetaName;
	const namespaceURI = metaName.namespaceURI.href satisfies MetaNamespaceURIValue;

	const result = Array.from(group.children.entries()).find(
		(entry): entry is [number, LeafNodeInitOptions] => {
			const [, child] = entry;

			if (!isLeafNodeInitOptions(child)) {
				return false;
			}

			const [instanceNode] = child.instanceNodes;
			const { qualifiedName } = instanceNode;

			return (
				qualifiedName.localName === localName && qualifiedName.namespaceURI?.href === namespaceURI
			);
		}
	);

	return result ?? null;
};

const getInstanceIDValue = (group: MetaGroupInitOptions): string | null => {
	const [, child = null] = findMetaLeafChild(group, INSTANCE_ID_LOCAL_NAME) ?? [];

	if (child == null) {
		return null;
	}

	const [instanceIDNode] = child.instanceNodes;

	return instanceIDNode.value satisfies string;
};

type AssertStaticLeafElement = (element: StaticElement) => asserts element is StaticLeafElement;

const assertStaticLeafElement: AssertStaticLeafElement = (element) => {
	if (!element.isLeafElement()) {
		throw new ErrorProductionDesignPendingError(
			`Expected a leaf element, got a non-leaf element at nodeset: ${element.nodeset}`
		);
	}
};

/**
 * @todo this name and signature are general, for the same reasons as the TODO
 * on {@link populateDeprecatedID}.
 */
const buildMetaValueElement = (
	group: MetaGroupInitOptions,
	localName: string,
	value: string
): StaticLeafElement => {
	const { qualifiedName, nodeset } = group.parent.definition;
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
	group: EditModeMetaGroupInitOptions,
	instanceNode: StaticLeafElement
): LeafNodeDefinition => {
	const nodeset = instanceNode.nodeset;
	const bind = group.model.binds.getOrCreateBindDefinition(nodeset);

	return new LeafNodeDefinition(group.model, group.parent.definition, bind, null, instanceNode);
};

const buildDeprecatedID = (
	group: EditModeMetaGroupInitOptions,
	value: string
): LeafNodeInitOptions => {
	const instanceNode = buildMetaValueElement(group, DEPRECATED_ID_LOCAL_NAME, value);
	const definition = buildDeprecatedIDDefinition(group, instanceNode);

	return {
		childNodeset: instanceNode.nodeset,
		definition,
		instanceNodes: [instanceNode],
	};
};

const updateDeprecatedID = (
	group: EditModeMetaGroupInitOptions,
	child: LeafNodeInitOptions,
	value: string
): LeafNodeInitOptions => {
	const instanceNode = buildMetaValueElement(group, DEPRECATED_ID_LOCAL_NAME, value);

	return {
		childNodeset: child.childNodeset,
		definition: child.definition,
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

const replaceOrConcat = <T>(values: readonly T[], index: number | null, value: T): readonly T[] => {
	if (index == null) {
		return values.concat(value);
	}

	return replace(values, index, value);
};

/**
 * @todo Whenever we have bandwidth to start migrating away from DOM usage in
 * {@link XFormDOM}, this is a good place to start for logic equivalent to the
 * hacky normalization for `instanceID`.
 */
const populateDeprecatedID = (
	group: EditModeMetaGroupInitOptions
): EditModeMetaGroupInitOptions => {
	const value = getInstanceIDValue(group);

	if (value == null) {
		return group;
	}

	const [index, currentDeprecatedID] = findMetaLeafChild(group, DEPRECATED_ID_LOCAL_NAME) ?? [null];

	let deprecatedID: LeafNodeInitOptions;

	if (currentDeprecatedID == null) {
		deprecatedID = buildDeprecatedID(group, value);
	} else {
		deprecatedID = updateDeprecatedID(group, currentDeprecatedID, value);
	}

	return {
		model: group.model,
		parent: group.parent,
		children: replaceOrConcat(group.children, index, deprecatedID),
	};
};

const normalizeMetaGroup = (group: MetaGroupInitOptions): MetaGroupInitOptions => {
	if (isEditModeMetaGroup(group)) {
		return populateDeprecatedID(group);
	}

	return group;
};

export const normalizeChildInitOptions = (options: ChildrenInitOptions): ChildrenInitOptions => {
	if (isMetaGroup(options)) {
		return normalizeMetaGroup(options);
	}

	return options;
};
