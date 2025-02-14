import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { ClientReactiveSubmittableValueNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableValueNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createValueNodeSubmissionState = (
	node: ClientReactiveSubmittableValueNode
): SubmissionState => {
	const { qualifiedName } = node.definition;

	return {
		get submissionXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const xmlValue = escapeXMLText(node.currentState.instanceValue);

			return serializeLeafElementXML(qualifiedName, xmlValue);
		},
	};
};
