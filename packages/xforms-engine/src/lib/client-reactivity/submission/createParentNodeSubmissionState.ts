import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { GeneralChildNode } from '../../../instance/hierarchy.ts';
import type { ClientReactiveSubmittableParentNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createParentNodeSubmissionState = (
	node: ClientReactiveSubmittableParentNode<GeneralChildNode>
): InstanceState => {
	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren);
		},
	};
};
