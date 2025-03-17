import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { AnyNodeDefinition } from './NodeDefinition.ts';
import type { RootDefinition } from './RootDefinition.ts';

export type NodesetReference = string;

const collectDefinitions = (
	result: Map<NodesetReference, AnyNodeDefinition>,
	definition: AnyNodeDefinition
): Map<NodesetReference, AnyNodeDefinition> => {
	const { nodeset } = definition;

	if (result.has(nodeset)) {
		throw new ErrorProductionDesignPendingError();
	}

	result.set(nodeset, definition);

	if (definition.type === 'leaf-node') {
		return result;
	}

	for (const child of definition.children) {
		collectDefinitions(result, child);
	}

	return result;
};

export type NodeDefinitionMap = ReadonlyMap<NodesetReference, AnyNodeDefinition>;

export const nodeDefinitionMap = (root: RootDefinition): NodeDefinitionMap => {
	return collectDefinitions(new Map(), root);
};
