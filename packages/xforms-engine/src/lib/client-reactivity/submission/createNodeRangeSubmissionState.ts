import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { ClientReactiveSubmittableParentNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import type { RepeatInstance } from '../../../instance/repeat/RepeatInstance.ts';

export const createNodeRangeSubmissionState = (
	node: ClientReactiveSubmittableParentNode<RepeatInstance>
): SubmissionState => {
	return {
		get submissionXML() {
			const serializedChildren = node.currentState.children.map((child) => {
				return child.submissionState.submissionXML;
			});

			return serializedChildren.join('');
		},
	};
};
