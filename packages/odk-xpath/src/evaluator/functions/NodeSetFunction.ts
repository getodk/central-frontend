import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { Expression } from '../expression/Expression.ts';
import type {
  FunctionImplementationOptions,
  FunctionSignature,
} from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type NodeSetFunctionCallable = <Arguments extends readonly Expression[]>(
  context: EvaluationContext,
  args: Arguments
) => Iterable<Node>;

export class NodeSetFunction<Length extends number> extends FunctionImplementation<Length> {
  constructor(
    signature: FunctionSignature<Length>,
    call: NodeSetFunctionCallable,
    options?: FunctionImplementationOptions
  ) {
    super(signature, (context, args) => {
      const nodes = call(context, args);

      return new LocationPathEvaluation(context, nodes);
    }, options);
  }
}
