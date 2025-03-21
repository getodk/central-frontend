import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { ModelDefinition } from '../../parse/model/ModelDefinition.ts';
import type {
	AnyNodeDefinition,
	ChildNodeDefinition,
	NodeDefinition,
} from '../../parse/model/NodeDefinition.ts';
import type { InstanceNode } from '../abstract/InstanceNode.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { DescendantNodeInitOptions } from './DescendantNodeInitOptions.ts';
import { normalizeChildInitOptions } from './normalizeChildInitOptions.ts';

/**
 * Child nodesets are collected from the {@link parent}'s
 * {@link NodeDefinition.template}, ensuring that we produce
 * {@link InstanceNode}s for every **model-defined** node, even if a
 * corresponding node was not serialized in a {@link parent.instanceNode}.
 *
 * In other words, by referencing the model-defined template, we are able to
 * reproduce nodes which were omitted as non-relevant in a prior serialization
 * and/or submission.
 *
 * @todo Since we're building an instance node's children from the nodesets of
 * the model-defined node's children, we are _implicitly dropping_ any excess
 * nodes from non-model instance data. That's probably the right behavior, but
 * we may want to warn for such nodes if/when we do drop them.
 */
const collectModelChildNodesets = (parentTemplate: StaticElement): readonly string[] => {
	const nodesets = parentTemplate.childElements.map(({ nodeset }) => {
		return nodeset;
	});

	return Array.from(new Set(nodesets));
};

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

type AssertChildNodeDefinition = (
	definition: AnyNodeDefinition,
	childNodeset: string
) => asserts definition is ChildNodeDefinition;

const assertChildNodeDefinition: AssertChildNodeDefinition = (definition, childNodeset) => {
	if (definition.type === 'root') {
		throw new Error(`Unexpected root definition for child nodeset: ${childNodeset}`);
	}
};

export interface ChildrenInitOptions {
	readonly parent: GeneralParentNode;
	readonly model: ModelDefinition;
	readonly children: readonly DescendantNodeInitOptions[];
}

export const childrenInitOptions = (parent: GeneralParentNode): ChildrenInitOptions => {
	const { model } = parent.rootDocument;
	const childNodesets = collectModelChildNodesets(parent.definition.template);

	let instanceChildren: InstanceNodesByNodeset | null;

	if (parent.instanceNode == null) {
		instanceChildren = null;
	} else {
		instanceChildren = groupChildElementsByNodeset(parent.instanceNode);
	}

	const children = childNodesets.map((childNodeset) => {
		const definition = model.getNodeDefinition(childNodeset);

		assertChildNodeDefinition(definition, childNodeset);

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
		const instanceNodes = instanceChildren?.get(childNodeset) ?? [];

		return {
			childNodeset,
			definition,
			instanceNodes,
		};
	});
	const baseResult: ChildrenInitOptions = {
		parent,
		model,
		children,
	};

	return normalizeChildInitOptions(baseResult);
};
