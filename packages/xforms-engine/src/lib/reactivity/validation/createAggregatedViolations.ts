import { createMemo } from 'solid-js';
import type {
	AncestorNodeValidationState,
	DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { AnyParentNode, AnyValueNode } from '../../../instance/hierarchy.ts';

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
		node,
		violation,
	};
};

const collectViolationReferences = (
	context: AnyParentNode
): readonly DescendantNodeViolationReference[] => {
	return context.getChildren().flatMap((child) => {
		switch (child.nodeType) {
			case 'string':
			case 'select': {
				const reference = violationReference(child);

				if (reference == null) {
					return [];
				}

				return [reference];
			}

			default:
				return child.validationState.violations;
		}
	});
};

export const createAggregatedViolations = (context: AnyParentNode): AncestorNodeValidationState => {
	return context.scope.runTask(() => {
		const violations = createMemo(() => {
			return collectViolationReferences(context);
		});

		return {
			get violations() {
				return violations();
			},
		};
	});
};
