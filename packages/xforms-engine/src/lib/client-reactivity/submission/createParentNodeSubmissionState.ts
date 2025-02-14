import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { GeneralChildNode } from '../../../instance/hierarchy.ts';
import type { ClientReactiveSubmittableParentNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createParentNodeSubmissionState = (
	node: ClientReactiveSubmittableParentNode<GeneralChildNode>
): SubmissionState => {
	return {
		get submissionXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const serializedChildren = node.currentState.children.map((child) => {
				return child.submissionState.submissionXML;
			});

			return serializeParentElementXML(node.definition.qualifiedName, serializedChildren);
		},
	};
};
