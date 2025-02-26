import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { Root } from '../../../instance/Root.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createRootInstanceState = (node: Root): InstanceState => {
	return {
		get instanceXML() {
			const { namespaceDeclarations, attributes } = node.definition;
			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren, {
				namespaceDeclarations,
				attributes: Array.from(attributes.values()),
			});
		},
	};
};
