import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
  AncestorNodeValidationState,
  DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { AnyNode, AnyParentNode } from '../../../instance/hierarchy.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';

const violationReference = (node: AnyNode): DescendantNodeViolationReference[] => {
  if (node.nodeType === 'primary-instance') {
    return [];
  }
  const violation = node.getViolation();
  if (violation == null) {
    return [];
  }

  const { nodeId } = node;

  return [
    {
      nodeId,
      get node() {
        return node;
      },
      get reference() {
        return node.currentState.reference;
      },
      violation,
    },
  ];
};

const collectViolationReferences = (
  context: AnyParentNode
): readonly DescendantNodeViolationReference[] => {
  const violations = violationReference(context);
  const attributeViolations = context.getAttributes().flatMap((a) => {
    return violationReference(a);
  });
  const childViolations = context.getChildren().flatMap((child) => {
    switch (child.nodeType) {
      case 'model-value':
      case 'input':
      case 'note':
      case 'select':
      case 'range':
      case 'rank':
      case 'trigger':
      case 'upload':
        // leaf node
        return violationReference(child);
      default:
        return collectViolationReferences(child);
    }
  });
  return [...violations, ...attributeViolations, ...childViolations];
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
