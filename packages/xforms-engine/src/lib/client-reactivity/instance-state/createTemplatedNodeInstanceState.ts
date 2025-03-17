import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import { TemplatedNodeAttributeSerializationError } from '../../../error/TemplatedNodeAttributeSerializationError.ts';
import type { ClientReactiveSerializableTemplatedNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableTemplatedNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

/**
 * @see {@link TemplatedNodeAttributeSerializationError}
 */
export const createTemplatedNodeInstanceState = (
	node: ClientReactiveSerializableTemplatedNode
): InstanceState => {
	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			const { attributes } = node.currentState;

			if (attributes != null) {
				throw new TemplatedNodeAttributeSerializationError();
			}

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren);
		},
	};
};
