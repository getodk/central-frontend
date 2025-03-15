import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { AnyNodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export type NodesetReference = string;

const collectDefinitions = (
	acc: Map<NodesetReference, AnyNodeDefinition>,
	definition: AnyNodeDefinition
): Map<NodesetReference, AnyNodeDefinition> => {
	const { nodeset } = definition;

	if (acc.has(nodeset)) {
		throw new ErrorProductionDesignPendingError();
	}

	acc.set(nodeset, definition);

	if (definition.type === 'leaf-node') {
		return acc;
	}

	for (const child of definition.children) {
		collectDefinitions(acc, child);
	}

	return acc;
};

export type NodeDefinitionMap = ReadonlyMap<NodesetReference, AnyNodeDefinition>;

export const nodeDefinitionMap = (root: RootDefinition): NodeDefinitionMap => {
	return collectDefinitions(new Map(), root);
};
