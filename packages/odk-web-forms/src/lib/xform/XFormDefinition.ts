import { XFormDOM } from './XFormDOM.ts';
import { BodyDefinition } from './body/BodyDefinition.ts';
import { ModelDefinition } from './model/ModelDefinition.ts';
import type { AnyNodeDefinition } from './model/NodeDefinition.ts';
import type { RootDefinition } from './model/RootDefinition.ts';

type TopologicalSortIndex = number;

type SortedNodesetIndexes = ReadonlyMap<string, TopologicalSortIndex>;

const collectNodes = (parentNode: AnyNodeDefinition): readonly AnyNodeDefinition[] => {
	let children: readonly AnyNodeDefinition[];

	switch (parentNode.type) {
		case 'repeat-sequence':
			children = parentNode.instances;
			break;

		case 'value-node':
			children = [];
			break;

		default:
			children = parentNode.children;
	}

	return [parentNode].concat(children.flatMap(collectNodes));
};

const visit = (
	nodesByNodeset: Map<string, AnyNodeDefinition>,
	visited: Set<AnyNodeDefinition>,
	visiting: Set<AnyNodeDefinition>,
	node: AnyNodeDefinition,
	sorted: AnyNodeDefinition[]
): AnyNodeDefinition[] => {
	if (visited.has(node)) {
		return sorted;
	}

	if (visiting.has(node)) {
		throw new Error(`Cycle detected for node with nodeset: ${node.nodeset}`);
	}

	visiting.add(node);

	for (const nodeset of node.dependencyExpressions) {
		const dependency = nodesByNodeset.get(nodeset);

		if (dependency != null) {
			visit(nodesByNodeset, visited, visiting, dependency, sorted);
		}
	}

	visiting.delete(node);
	visited.add(node);
	sorted.push(node);

	return sorted;
};

/**
 * Performs a topological sort on all of a form's nodes, using a general
 * depth-first search algorithm. This (presently) differs from the
 * {@link https://www.w3.org/TR/xforms11/#rpm-processing-recalc-mddg | algorithm as described in XForms 1.0},
 * in that:
 *
 * - it performs a single sort up-front upon parsing the form; handling of
 *   recomputed subgraphs after a value change is (at least presently) deferred
 *   to reactive subscriptions, established when computing the complete form on
 *   load (with the same process applied to newly added subtrees, i.e. when
 *   adding a repeat instance)
 * - dependency types are not tracked separately
 * - the number of vertices is not tracked, and cycles are detected by a binary
 *   "visiting" condition
 */
const sortNodes = (root: RootDefinition): SortedNodesetIndexes => {
	const nodes = collectNodes(root);
	const nodesByNodeset = new Map<string, AnyNodeDefinition>(
		nodes.map((node) => [node.nodeset, node])
	);

	const visited = new Set<AnyNodeDefinition>();
	const visiting = new Set<AnyNodeDefinition>();
	const sorted: AnyNodeDefinition[] = [];

	for (const node of nodes) {
		visit(nodesByNodeset, visited, visiting, node, sorted);
	}

	return new Map(sorted.map((node, index) => [node.nodeset, index]));
};

export class XFormDefinition {
	readonly xformDOM: XFormDOM;
	readonly xformDocument: XMLDocument;

	readonly id: string;
	readonly title: string;

	readonly rootReference: string;

	readonly body: BodyDefinition;
	readonly model: ModelDefinition;
	readonly sortedNodesetIndexes: SortedNodesetIndexes;

	constructor(readonly sourceXML: string) {
		const xformDOM = XFormDOM.from(sourceXML);

		this.xformDOM = xformDOM;

		const { primaryInstanceRoot, title, xformDocument } = xformDOM;
		const id = primaryInstanceRoot.getAttribute('id');

		if (id == null) {
			throw new Error('Primary instance root has no id');
		}

		this.xformDocument = xformDocument;
		this.id = id;
		this.title = title.textContent ?? '';

		// TODO: highly unlikely primary instance root will need a namespace prefix
		// but noting it just in case there is such weird usage...
		this.rootReference = `/${primaryInstanceRoot.localName}`;

		this.body = new BodyDefinition(this);
		this.model = new ModelDefinition(this);
		this.sortedNodesetIndexes = sortNodes(this.model.root);
	}
}
