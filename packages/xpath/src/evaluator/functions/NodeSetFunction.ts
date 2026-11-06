import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument, FunctionSignature } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type NodeSetFunctionCallable = <
  T extends XPathNode,
  Arguments extends readonly EvaluableArgument[],
>(
  context: LocationPathEvaluation<T>,
  args: Arguments
) => readonly T[];

interface NodeSetFunctionOptions {
  readonly immutable?: boolean;
}

export class NodeSetFunction extends FunctionImplementation {
  constructor(
    localName: string,
    signature: FunctionSignature,
    call: NodeSetFunctionCallable,
    options?: NodeSetFunctionOptions
  ) {
    super(localName, signature, (context, args) => {
      const nodes = call(context, args);

      return LocationPathEvaluation.fromNodes(context, new Set(nodes), options);
    });
  }
}
