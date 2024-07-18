import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
	AncestorNodeValidationState,
	DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { AnyParentNode, AnyValueNode } from '../../../instance/hierarchy.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';

const violationReference = (node: AnyValueNode): DescendantNodeViolationReference | null => {
	const violation = node.getViolation();

	if (violation == null) {
		return null;
	}

	const { nodeId } = node;

	return {
		nodeId,
		get reference() {
			return node.currentState.reference;
		},
		violation,
	};
};

const collectViolationReferences = (
	context: AnyParentNode
): readonly DescendantNodeViolationReference[] => {
	return context.getChildren().flatMap((child) => {
		switch (child.nodeType) {
			case 'model-value':
			case 'note':
			case 'string':
			case 'select': {
				const reference = violationReference(child);

				if (reference == null) {
					return [];
				}

				return [reference];
			}

			default:
				return collectViolationReferences(child);
		}
	});
};

interface AggregatedViolationsOptions {
	readonly clientStateFactory: OpaqueReactiveObjectFactory<AncestorNodeValidationState>;
}

export const createAggregatedViolations = (
	context: AnyParentNode,
	options: AggregatedViolationsOptions
): AncestorNodeValidationState => {
	const { scope } = context;

	return scope.runTask(() => {
		const violations = createMemo(() => {
			return collectViolationReferences(context);
		});
		const spec = { violations };

		return createSharedNodeState(scope, spec, options).currentState;
	});
};
