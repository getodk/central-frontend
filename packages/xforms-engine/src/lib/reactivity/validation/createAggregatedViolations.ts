import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
  AncestorNodeValidationState,
  DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { AnyNode, AnyParentNode } from '../../../instance/hierarchy.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';

const nodeViolations = (node: AnyNode): DescendantNodeViolationReference[] => {
  if (node.nodeType === 'primary-instance') {
    return [];
  }
  const voilations = node.getViolation() ?? null;
  const attributeViolations = node.getAttributes().map((a) => a.getViolation());

  const { nodeId } = node;
  return [voilations, ...attributeViolations]
    .filter((violation) => !!violation)
    .map((violation) => ({
      nodeId,
      get node() {
        return node;
      },
      get reference() {
        return node.currentState.reference;
      },
      violation,
    }));
};

const collectViolationReferences = (
  context: AnyParentNode
): readonly DescendantNodeViolationReference[] => {
  const violations = nodeViolations(context);
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
        return nodeViolations(child);
      default:
        return collectViolationReferences(child);
    }
  });
  return [...violations, ...childViolations];
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
