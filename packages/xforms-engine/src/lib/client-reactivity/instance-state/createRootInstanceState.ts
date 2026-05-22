import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { Root } from '../../../instance/Root.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createRootInstanceState = (node: Root): InstanceState => {
	return {
		get instanceXML() {
			return serializeParentElementXML(
				node.definition.qualifiedName,
				node.currentState.children,
				node.currentState.attributes,
				node.definition.namespaceDeclarations
			);
		},
	};
};
