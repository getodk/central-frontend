import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSubmittableParentNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import type { RepeatInstance } from '../../../instance/repeat/RepeatInstance.ts';

export const createNodeRangeSubmissionState = (
	node: ClientReactiveSubmittableParentNode<RepeatInstance>
): InstanceState => {
	return {
		get instanceXML() {
			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			return serializedChildren.join('');
		},
	};
};
