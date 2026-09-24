import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
  AncestorNodeValidationState,
  DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { AnyNode, AnyParentNode } from '../../../instance/hierarchy.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';

const nodeViolation = (node: AnyNode): DescendantNodeViolationReference | null => {
  if (node.nodeType === 'primary-instance') {
    return null;
  }
  const violation = node.getViolation();
  if (!violation) {
    return null;
  }

  const { nodeId } = node;
  return {
    nodeId,
    get node() {
      return node;
    },
    get reference() {
      return node.currentState.reference;
    },
    violation,
  };
};

const nodeViolations = (node: AnyNode): DescendantNodeViolationReference[] => {
  const violation = nodeViolation(node);
  const attributeViolations = node.getAttributes().map((attribute) => nodeViolation(attribute));
  return [violation, ...attributeViolations].filter((v) => !!v);
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
