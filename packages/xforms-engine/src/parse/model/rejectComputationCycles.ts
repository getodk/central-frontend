import { ComputationCycleError } from '../../error/ComputationCycleError.ts';
import { resolveDependencyNodesets } from '../xpath/dependency-analysis.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { ModelBindMap } from './ModelBindMap.ts';
import type { NodeDefinitionMap } from './nodeDefinitionMap.ts';

interface Computation {
  readonly nodeset: string;
  readonly affectsNodesInside: boolean;
  readonly reads: readonly string[];
}

// position(current()) reads the node's position, not its value, so it is not counted as a dependency
// (same as JavaRosa's bare position())
const withoutContextPositionCalls = (expression: string) => {
  return expression.replaceAll(/position\(\s*current\(\)\s*\)/g, 'position()');
};

const computationsOfBind = (bind: BindDefinition): readonly Computation[] => {
  // `constraint` is excluded, as in JavaRosa; it is expected to reference its own node.
  // `relevant` affects every node inside its own (hiding a group hides its children), like in JavaRosa.
  const candidates = [
    ...(bind.calculate == null ? [] : [{ expression: bind.calculate, affectsNodesInside: false }]),
    { expression: bind.relevant, affectsNodesInside: true },
    { expression: bind.readonly, affectsNodesInside: false },
    { expression: bind.required, affectsNodesInside: false },
  ];

  return candidates
    .filter(({ expression }) => !expression.isDefaultExpression)
    .map(({ expression, affectsNodesInside }) => {
      return {
        nodeset: bind.nodeset,
        affectsNodesInside,
        reads: resolveDependencyNodesets(
          bind.nodeset,
          withoutContextPositionCalls(expression.expression)
        ),
      };
    });
};

// Only nodes that exist in the model count as "inside", as in JavaRosa.
// A reference to a nonexistent child (e.g. relevant="abc" on a leaf) is not considered here.
const dependsOn = (
  reader: Computation,
  writer: Computation,
  modelNodesets: NodeDefinitionMap
) => {
  return reader.reads.some((read) => {
    if (read === writer.nodeset) {
      return true;
    }

    return (
      writer.affectsNodesInside &&
      read.startsWith(`${writer.nodeset}/`) &&
      modelNodesets.has(read)
    );
  });
};

// Keep removing computations that depend on nothing unresolved.
// What remains is in a cycle, or reads a value produced by one.
const dropResolvable = (
  unresolved: readonly Computation[],
  modelNodesets: NodeDefinitionMap
): readonly Computation[] => {
  const remaining = unresolved.filter((reader: Computation) => {
    return unresolved.some((writer) => dependsOn(reader, writer, modelNodesets));
  });

  return remaining.length === unresolved.length ? remaining : dropResolvable(remaining, modelNodesets);
};

// Rejects forms whose `<bind>` computations depend on each other in a cycle.
export const rejectComputationCycles = (
  binds: ModelBindMap,
  modelNodesets: NodeDefinitionMap
) => {
  const computations = Array
    .from(binds.values())
    .flatMap((bind) => computationsOfBind(bind));

  const cycleMembers = dropResolvable(computations, modelNodesets);
  if (cycleMembers.length > 0) {
    const cycleNodesets = cycleMembers.map((computation) => computation.nodeset);
    throw new ComputationCycleError(Array.from(new Set(cycleNodesets)));
  }
};
