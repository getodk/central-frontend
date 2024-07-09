import type { ShallowMutable } from '@getodk/common/types/helpers.js';
import { createComputed, createMemo, on } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
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

interface AggregatedViolationsOptions {
	readonly clientStateFactory: OpaqueReactiveObjectFactory<AncestorNodeValidationState>;
}

/**
 * @todo This implementation is intentionally naive! Since we anticipate the
 * possibility of making computing validation state lazier, aggregated state is
 * a good candidate for where we might start. The solution here is intended to
 * unblock client reactivity without expanding or entrenching any particular
 * approach to storing/serializing/materializing complex shared state object
 * values (i.e. {@link DescendantNodeViolationReference.node}).
 */
export const createAggregatedViolations = (
	context: AnyParentNode,
	options: AggregatedViolationsOptions
): AncestorNodeValidationState => {
	return context.scope.runTask(() => {
		const clientState = options.clientStateFactory<ShallowMutable<AncestorNodeValidationState>>({
			violations: [] as readonly DescendantNodeViolationReference[],
		});

		const violations = createMemo(() => {
			return collectViolationReferences(context);
		});

		createComputed(
			on(violations, () => {
				// Acknowledging this is a naive implementation: the intent here is that
				// it doesn't really matter **what value** is written, only that a write
				// has occurred. The corresponding read in the Proxy below is sufficient
				// to register read-based subscriptions (at least as tested in Vue).
				clientState.violations = [];
			})
		);

		return new Proxy(clientState, {
			get(_, property, target) {
				if (property === 'violations') {
					// This check doesn't matter, we just need to read the state.
					if (clientState.violations.length === 0) {
						return violations();
					}
				}

				// Pass through any other reads, which may vary by client reactivity.
				// Many Proxy-based mutable store solutions attach one or more internal
				// Symbol properties that they will reference for... reasons.
				return Reflect.get(clientState, property, target) as unknown;
			},
			set() {
				return false;
			},
		});
	});
};
