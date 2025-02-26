import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSubmittableValueNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableValueNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createValueNodeSubmissionState = (
	node: ClientReactiveSubmittableValueNode
): InstanceState => {
	const { qualifiedName } = node.definition;

	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const xmlValue = escapeXMLText(node.currentState.instanceValue);

			return serializeLeafElementXML(qualifiedName, xmlValue);
		},
	};
};
