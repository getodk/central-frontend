import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { ModelDefinition } from '../../parse/model/ModelDefinition.ts';
import type {
	AnyNodeDefinition,
	ChildNodeDefinition,
	NodeDefinition,
} from '../../parse/model/NodeDefinition.ts';
import type { DescendantNode } from '../abstract/DescendantNode.ts';
import type { InstanceNode } from '../abstract/InstanceNode.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import { normalizeChildInputs } from './normalizeChildInputs.ts';

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
 * nodes from instance input (i.e. any children which don't have a corresponding
 * model-defined nodeset). That's probably the right behavior, but we may want
 * to warn for such nodes if/when we do drop them.
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

/**
 * @todo We could pretty significantly simplify downstream child node
 * construction logic, if we break this down into a tagged union (essentially
 * moving the branchy type refinement aspects up the stack, probably trimming
 * the construction logic itself down to a switch statement). At which point,
 * it'd also probably be easier to reason about each of those constructors
 * accepting input exactly as it's represented as a member of this hypothetical
 * tagged union. Something like this:
 *
 * - Revise each concrete {@link DescendantNode} class to accept an options-like
 *   object suitable for its construction, each respectively defined by an
 *   interface whose name is consistent with that node
 * - Update this type to be a union of those interfaces
 * - Implement that in {@link collectChildInputs}
 * - Update downstream construction to switch over whatever narrows the union
 * - Bonus points: revise each concrete {@link DescendantNode} to use a common
 *   constructor API (i.e. a static `from` method, since several such classes
 *   already have private constructors). Then downstream isn't even a switch
 *   statement, it's just a lookup table.
 */
export interface InstanceNodeChildInput {
	readonly childNodeset: string;
	readonly definition: ChildNodeDefinition;
	readonly instanceNodes: readonly StaticElement[];
}

export const collectChildInputs = (
	model: ModelDefinition,
	parent: GeneralParentNode
): readonly InstanceNodeChildInput[] => {
	const childNodesets = collectModelChildNodesets(parent.definition.template);

	let instanceChildren: InstanceNodesByNodeset | null;

	if (parent.instanceNode == null) {
		instanceChildren = null;
	} else {
		instanceChildren = groupChildElementsByNodeset(parent.instanceNode);
	}

	const inputs = childNodesets.map((childNodeset) => {
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

	return normalizeChildInputs(model, parent, inputs);
};
