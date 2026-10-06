import { createMemo } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../client/OpaqueReactiveObjectFactory.ts';
import type {
  AncestorNodeValidationState,
  DescendantNodeViolationReference,
} from '../../../client/validation.ts';
import type { Attribute } from '../../../instance/Attribute.ts';
import type { PrimaryInstance } from '../../../instance/PrimaryInstance.ts';
import type { AnyChildNode, AnyParentNode } from '../../../instance/hierarchy.ts';
import { createSharedNodeState } from '../node-state/createSharedNodeState.ts';

type ViolationReferences = DescendantNodeViolationReference[];

type ReportingNode = Exclude<AnyChildNode | AnyParentNode, PrimaryInstance>;

const addViolation = (node: Attribute | ReportingNode, references: ViolationReferences): void => {
  const violation = node.getViolation();
  if (!violation) {
    return;
  }

  references.push({
    nodeId: node.nodeId,
    get node() {
      return node;
    },
    get reference() {
      return node.currentState.reference;
    },
    violation,
  });
};

const addViolations = (node: ReportingNode, references: ViolationReferences): void => {
  addViolation(node, references);
  node.getStaticAttributes().forEach((attribute) => addViolation(attribute, references));
  node.getChildren().forEach((child) => addViolations(child, references));
};

const collectViolationReferences = (context: AnyParentNode): ViolationReferences => {
  const references: ViolationReferences = [];
  if (context.nodeType === 'primary-instance') {
    context.getChildren().forEach((child) => addViolations(child, references));
  } else {
    addViolations(context, references);
  }
  return references;
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
